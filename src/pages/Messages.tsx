import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

const Messages = () => {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const params = new URLSearchParams(location.search);
  const initialTo = params.get("to") || "";

  const [selectedUserId, setSelectedUserId] = useState<string>(initialTo);
  const [conversations, setConversations] = useState<Record<string, MessageRow>>({});
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    document.title = `${t("messages.pageTitle")} - tudofaz`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("messages.meta"));
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, [t]);

  const myId = user?.id ?? "";

  const counterpart = (m: MessageRow) => (m.sender_id === myId ? m.recipient_id : m.sender_id);

  const loadInbox = async () => {
    if (!myId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,content,created_at")
      .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error(error);
      return;
    }
    const map: Record<string, MessageRow> = {};
    for (const m of data!) {
      const key = counterpart(m);
      if (!map[key]) map[key] = m;
    }
    setConversations(map);
    if (!selectedUserId && Object.keys(map).length > 0) {
      setSelectedUserId(Object.keys(map)[0]);
    }
  };

  const loadThread = async (otherId: string) => {
    if (!myId || !otherId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,content,created_at")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setThread(data || []);
  };

  useEffect(() => {
    loadInbox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  useEffect(() => {
    if (selectedUserId) loadThread(selectedUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, myId]);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as MessageRow;
        if (m.sender_id !== myId && m.recipient_id !== myId) return;
        setConversations((prev) => ({ ...prev, [counterpart(m)]: m }));
        if (selectedUserId && (m.sender_id === selectedUserId || m.recipient_id === selectedUserId)) {
          setThread((t) => [...t, m]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, selectedUserId]);

  const handleSend = async () => {
    if (!newMsg.trim() || !myId || !selectedUserId) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: myId,
      recipient_id: selectedUserId,
      content: newMsg.trim(),
    });
    if (error) {
      console.error(error);
      return;
    }
    setNewMsg("");
  };

  const sortedConversations = useMemo(() =>
    Object.entries(conversations)
      .sort((a, b) => new Date(b[1].created_at).getTime() - new Date(a[1].created_at).getTime())
  , [conversations]);

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{t("messages.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("messages.subtitle")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-4 md:h-[70vh] overflow-y-auto">
          <div className="space-y-2">
        {sortedConversations.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("messages.none")}</p>
        )}
            {sortedConversations.map(([otherId, last]) => (
              <button
                key={otherId}
                onClick={() => setSelectedUserId(otherId)}
                className={`w-full text-left rounded-md px-3 py-2 transition ${selectedUserId === otherId ? "bg-accent" : "hover:bg-accent/50"}`}
              >
                <div className="text-sm font-medium">{t("messages.user")} {otherId.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground truncate">{last.content}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:col-span-2 md:h-[70vh] flex flex-col">
          {!selectedUserId ? (
            <div className="m-auto text-muted-foreground">{t("messages.selectToStart")}</div>
          ) : (
            <>
              <div className="border-b pb-2 mb-4">
              <h2 className="font-medium">{t("messages.chattingWith")} {selectedUserId.slice(0,8)}</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {thread.map((m) => (
                  <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender_id === myId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content}
                    <div className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString(i18n.language || "pt-BR")}</div>
                  </div>
                ))}
                {thread.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem mensagens. Diga olá!</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder={t("messages.writePlaceholder") as string}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend}>{t("messages.send")}</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
};

export default Messages;