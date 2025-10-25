import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card } from './ui/card'
import AICoach from './AICoach'
import FAQBrowser from './FAQBrowser'
import { MessageCircle, BookOpen } from 'lucide-react'

export default function AICoachFAQ({ userId }) {
  const [activeTab, setActiveTab] = useState('ai-coach')

  const handleAskAICoach = () => {
    setActiveTab('ai-coach')
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          AI Coach & FAQ
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get instant answers to your fitness and nutrition questions
        </p>
      </div>

      <Card className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="ai-coach" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              AI Coach
            </TabsTrigger>
            <TabsTrigger 
              value="faq" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <BookOpen className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-coach" className="flex-1 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Note:</strong> AI Coach requires Supabase Edge Function setup to connect to OpenAI. 
                FAQ is fully functional and ready to use!
              </p>
            </div>
            <div className="flex-1">
              <AICoach userId={userId} />
            </div>
          </TabsContent>

          <TabsContent value="faq" className="flex-1 mt-0 data-[state=active]:flex data-[state=inactive]:hidden">
            <FAQBrowser userId={userId} onAskAICoach={handleAskAICoach} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> Start with the FAQ for quick answers to common questions. 
          For personalized advice or complex questions, chat with the AI Coach!
        </p>
      </div>
    </div>
  )
}

