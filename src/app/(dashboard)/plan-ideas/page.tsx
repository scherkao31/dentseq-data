'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Lightbulb,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  User,
  Bot,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect, useState } from 'react'

const STARTER_PROMPTS = [
  "Suggère-moi 3 idées de plans de traitement pour améliorer la diversité du dataset",
  "Quelles catégories de traitement manquent le plus ?",
  "Propose un plan impliquant de l'implantologie avec différents contextes patients",
  "Génère un plan parodontal complexe et des séquences pour patient anxieux vs non-anxieux",
  "Suggère un plan restauratif avec des variantes selon les contraintes budget/temps",
]

const chatTransport = new DefaultChatTransport({ api: '/api/chat' })

export default function PlanIdeasPage() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: chatTransport,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input
    setInput('')
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: message }],
    })
  }

  const handleStarterClick = (prompt: string) => {
    setInput(prompt)
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <>
      <Header title="Idées de Plans" />

      <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] flex-1 min-h-0">
          {/* Main Chat Area */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Assistant IA - Générateur d'idées
              </CardTitle>
              <CardDescription>
                Discutez avec l'IA pour générer des idées de plans de traitement et de contextes patients basés sur votre dataset actuel
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {/* Messages */}
              <ScrollArea ref={scrollRef} className="flex-1 pr-4 mb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold mb-2">Commencez la conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Demandez à l'IA de vous suggérer des idées de plans de traitement et des contextes patients pour enrichir votre dataset.
                      L'IA analysera vos plans et séquences existants pour proposer des suggestions pertinentes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'rounded-lg px-4 py-3 max-w-[80%]',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.parts.map((part, i) => {
                              if (part.type === 'text') {
                                return <span key={i}>{part.text}</span>
                              }
                              return null
                            })}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg px-4 py-3 bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Demandez des idées de plans de traitement..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    {messages.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleClear}
                        title="Effacer la conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar with suggestions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Suggestions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleStarterClick(prompt)}
                  >
                    <span className="text-xs line-clamp-2">{prompt}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comment utiliser</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  1. Cliquez sur une suggestion ou tapez votre propre question
                </p>
                <p>
                  2. L'IA analysera vos plans et séquences pour suggérer des idées pertinentes
                </p>
                <p>
                  3. Continuez la conversation pour affiner les idées
                </p>
                <p>
                  4. Utilisez les idées pour créer de nouveaux plans avec différents contextes patients
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
