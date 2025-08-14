import { useState, useEffect } from 'react';

interface BackgroundSyncTask {
  id: string;
  type: string;
  data: any;
  token?: string;
  attempts: number;
  maxAttempts: number;
  nextRetry: number;
}

export const useBackgroundSync = () => {
  const [pendingTasks, setPendingTasks] = useState<BackgroundSyncTask[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Load pending tasks from IndexedDB on mount
    loadPendingTasks();
    
    // Listen for online events
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const loadPendingTasks = async () => {
    try {
      const tasks = await getFromIndexedDB('background_sync_tasks');
      setPendingTasks(tasks);
    } catch (error) {
      console.error('Error loading pending tasks:', error);
    }
  };

  const addTask = async (type: string, data: any, options: {
    maxAttempts?: number;
    token?: string;
  } = {}) => {
    const task: BackgroundSyncTask = {
      id: crypto.randomUUID(),
      type,
      data,
      token: options.token,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      nextRetry: Date.now()
    };

    try {
      // Save to IndexedDB
      await saveToIndexedDB('background_sync_tasks', task);
      
      // Update local state
      setPendingTasks(prev => [...prev, task]);
      
      // Try to sync immediately if online
      if (navigator.onLine) {
        await syncTasks([task]);
      } else {
        // Register background sync
        await registerBackgroundSync(type);
      }
      
      return task.id;
    } catch (error) {
      console.error('Error adding background sync task:', error);
      throw error;
    }
  };

  const syncTasks = async (tasks: BackgroundSyncTask[] = pendingTasks) => {
    if (syncing || tasks.length === 0) return;

    setSyncing(true);
    
    try {
      for (const task of tasks) {
        if (task.attempts >= task.maxAttempts) {
          console.log('Task exceeded max attempts, removing:', task.id);
          await removeTask(task.id);
          continue;
        }

        if (Date.now() < task.nextRetry) {
          continue; // Not ready for retry yet
        }

        try {
          await executeTask(task);
          await removeTask(task.id);
          console.log('Task synced successfully:', task.id);
        } catch (error) {
          console.error('Task sync failed:', task.id, error);
          
          // Increment attempts and schedule retry
          const updatedTask = {
            ...task,
            attempts: task.attempts + 1,
            nextRetry: Date.now() + (Math.pow(2, task.attempts) * 1000) // Exponential backoff
          };
          
          await saveToIndexedDB('background_sync_tasks', updatedTask);
          
          setPendingTasks(prev => 
            prev.map(t => t.id === task.id ? updatedTask : t)
          );
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const executeTask = async (task: BackgroundSyncTask) => {
    switch (task.type) {
      case 'listing-create':
        return await syncListing(task);
      case 'message-send':
        return await syncMessage(task);
      case 'analytics':
        return await syncAnalytics(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  };

  const syncListing = async (task: BackgroundSyncTask) => {
    const response = await fetch('/rest/v1/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${task.token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc'
      },
      body: JSON.stringify(task.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncMessage = async (task: BackgroundSyncTask) => {
    const response = await fetch('/rest/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${task.token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc'
      },
      body: JSON.stringify(task.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const syncAnalytics = async (task: BackgroundSyncTask) => {
    const response = await fetch('https://jprmzutdujnufjyvxtss.supabase.co/functions/v1/telemetry-collector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwcm16dXRkdWpudWZqeXZ4dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc0MDMsImV4cCI6MjA3MDUxMzQwM30.oLRzf4v6IJvWuulfoZVwya6T8AUEWmN2pQNs6kZ4Qhc'
      },
      body: JSON.stringify(task.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const removeTask = async (taskId: string) => {
    await removeFromIndexedDB('background_sync_tasks', taskId);
    setPendingTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleOnline = () => {
    console.log('Device came online, syncing pending tasks...');
    syncTasks();
  };

  const registerBackgroundSync = async (tag: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Background sync is not available in all browsers
        if ('sync' in registration) {
          await (registration as any).sync.register(tag);
          console.log('Background sync registered:', tag);
        }
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  };

  const clearAllTasks = async () => {
    try {
      await clearIndexedDB('background_sync_tasks');
      setPendingTasks([]);
    } catch (error) {
      console.error('Error clearing tasks:', error);
    }
  };

  return {
    pendingTasks,
    syncing,
    addTask,
    syncTasks,
    removeTask,
    clearAllTasks
  };
};

// IndexedDB helpers
async function getFromIndexedDB(storeName: string): Promise<BackgroundSyncTask[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TudoFazDB', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function saveToIndexedDB(storeName: string, data: BackgroundSyncTask): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TudoFazDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const putRequest = store.put(data);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function removeFromIndexedDB(storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TudoFazDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function clearIndexedDB(storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TudoFazDB', 2);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}