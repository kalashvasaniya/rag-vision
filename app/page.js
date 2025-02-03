"use client";

import { Input } from "../components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import React from "react";
import ProjectOverview from "../components/project-overview";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const [toolCall, setToolCall] = useState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, newUserMessage];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    fetch('/api/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updatedMessages }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        
        if (data?.content) {
          const newAssistantMessage = {
            role: "assistant",
            content: data.content,
            toolInvocations: data.toolInvocations,
          };
          setMessages((prev) => [...prev, newAssistantMessage]);
        } else {
          toast.error("Invalid response from server.");
        }
      })
      .catch(() => {
        toast.error("Movie search unavailable. Please try again later!");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  const currentToolCall = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.toolInvocations?.[0]?.toolName;
  }, [messages]);

  const awaitingResponse = useMemo(() => {
    return isLoading && messages.slice(-1)[0]?.role === "user";
  }, [isLoading, messages]);

  const userQuery = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];

  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .slice(-1)[0];

  return (
    <div className="flex justify-center items-start sm:pt-16 min-h-screen w-full dark:bg-neutral-900 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-[500px]">
        <ProjectOverview description="Movie Encyclopedia AI" />
        <motion.div
          animate={{
            minHeight: isExpanded ? 200 : 0,
            padding: isExpanded ? 12 : 0,
          }}
          transition={{ type: "spring", bounce: 0.5 }}
          className={cn(
            "rounded-lg w-full",
            isExpanded
              ? "bg-neutral-200 dark:bg-neutral-800"
              : "bg-transparent"
          )}
        >
          <div className="flex flex-col w-full justify-between gap-2">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                className="bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300"
                minLength={3}
                required
                value={input}
                placeholder="Search movies (e.g. 'Christopher Nolan films from 2010s')"
                onChange={(e) => setInput(e.target.value)}
              />
            </form>

            <motion.div
              transition={{ type: "spring" }}
              className="min-h-fit flex flex-col gap-2"
            >
              <AnimatePresence>
                {awaitingResponse ? (
                  <div className="px-2 min-h-12">
                    <div className="dark:text-neutral-400 text-neutral-500 text-sm w-fit mb-1">
                      {userQuery?.content}
                    </div>
                    <Loading tool={currentToolCall} />
                  </div>
                ) : null}

                {lastAssistantMessage?.content && (
                  <div className="px-2 min-h-12">
                    {userQuery && (
                      <div className="dark:text-neutral-400 text-neutral-500 text-sm w-fit mb-1">
                        {userQuery.content}
                      </div>
                    )}
                    <AssistantMessage message={lastAssistantMessage} />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Rest of the components (AssistantMessage, Loading, MemoizedReactMarkdown) remain the same

const AssistantMessage = ({ message }) => {
  if (!message?.content) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-sm text-neutral-800 dark:text-neutral-200 space-y-2"
      >
        <ReactMarkdown className="prose dark:prose-invert">
          {message.content}
        </ReactMarkdown>
      </motion.div>
    </AnimatePresence>
  );
};


const Loading = ({ tool }) => {
  const toolName = tool === "movieSearch"
    ? "Searching movie database"
    : "Analyzing results";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring" }}
        className="flex items-center gap-2"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-2 w-2 rounded-full bg-neutral-400"
        />
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {toolName}...
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

const MemoizedReactMarkdown = React.memo(
  ({ children }) => (
    <ReactMarkdown
      components={{
        strong: ({ children }) => <strong className="font-semibold text-blue-600 dark:text-blue-400">{children}</strong>,
        em: ({ children }) => <em className="italic text-green-600 dark:text-green-400">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-4">{children}</ul>,
        li: ({ children }) => <li className="mb-1">{children}</li>
      }}
    >
      {children}
    </ReactMarkdown>
  )
);