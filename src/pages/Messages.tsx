import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRealTimeChat } from "@/hooks/useRealTimeChat";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Messages = () => {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [selectedChat, setSelectedChat] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);

  // SEO meta tags
  useEffect(() => {
    document.title = `${t("messages.pageTitle")} - tudofaz`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("messages.meta"));
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, [t]);

  // Verificar se há um usuário selecionado vindo da navegação
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedUserId) {
      setSelectedChat({
        userId: state.selectedUserId,
        userName: state.selectedUserName || state.selectedUserEmail,
        userEmail: state.selectedUserEmail
      });

      // Se há uma mensagem inicial, enviá-la
      if (state.initialMessage) {
        // Aguardar um pouco para garantir que o chat carregou
        setTimeout(() => {
          const messageInput = document.querySelector('input[placeholder="Digite sua mensagem..."]') as HTMLInputElement;
          if (messageInput) {
            messageInput.value = state.initialMessage;
            messageInput.focus();
          }
        }, 1000);
      }
    }
  }, [location.state]);

  const handleSelectChat = (userId: string, userName: string, userEmail: string) => {
    setSelectedChat({ userId, userName, userEmail });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (!user) {
    return (
      <main className="container mx-auto py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl">{t("messages.pageTitle")}</h1>
          <p className="text-muted-foreground">Você precisa estar logado para ver suas mensagens.</p>
        </header>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{t("messages.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("messages.subtitle")}</p>
      </header>
      
      <Card className="h-[600px] overflow-hidden">
        <div className="flex h-full">
          {/* Lista de conversas */}
          <div className={`border-r bg-card ${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-1/3`}>
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversas
              </h2>
            </div>
            <ChatList onSelectChat={handleSelectChat} />
          </div>

          {/* Janela de chat */}
          <div className={`${selectedChat ? 'block' : 'hidden md:block'} flex-1`}>
            {selectedChat ? (
              <ChatWindow
                recipientId={selectedChat.userId}
                recipientName={selectedChat.userName}
                recipientEmail={selectedChat.userEmail}
                onBack={handleBackToList}
              />
            ) : (
              <div className="hidden md:flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma conversa para começar a mensagem</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
};

export default Messages;