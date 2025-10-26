import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  VStack,
  HStack,
  Text,
  Select,
  Badge,
  IconButton,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  mode?: string;
}

interface ChatMode {
  value: string;
  label: string;
  color: string;
  description: string;
}

const CHAT_MODES: ChatMode[] = [
  {
    value: 'general',
    label: '💬 General Chat',
    color: 'blue',
    description: 'General conversation and Q&A',
  },
  {
    value: 'planner',
    label: '🎬 Video Planner',
    color: 'purple',
    description: 'Plan videos and create scripts',
  },
  {
    value: 'editor',
    label: '✂️ Editor',
    color: 'green',
    description: 'Get editing suggestions',
  },
  {
    value: 'scripter',
    label: '📝 Scripter',
    color: 'orange',
    description: 'Write scripts and dialogue',
  },
];

export default function MultiLLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/multi-chat/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          mode,
          session_id: sessionId,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        model: data.model_used,
        mode: data.mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to get AI response',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentMode = CHAT_MODES.find((m) => m.value === mode);

  return (
    <Flex direction="column" h="100%" w="100%" bg="gray.50" borderRadius="lg">
      {/* Header */}
      <Box p={4} bg="white" borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold">
              🤖 Multi-LLM Chat
            </Text>
            <Text fontSize="sm" color="gray.600">
              {currentMode?.description}
            </Text>
          </VStack>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            w="250px"
            size="sm"
          >
            {CHAT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </HStack>
      </Box>

      {/* Messages */}
      <VStack
        flex={1}
        overflowY="auto"
        p={4}
        spacing={4}
        align="stretch"
        css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
          '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
        }}
      >
        {messages.length === 0 ? (
          <Box textAlign="center" py={10} color="gray.500">
            <Text fontSize="lg" mb={2}>
              👋 Start a conversation!
            </Text>
            <Text fontSize="sm">
              Try: &quot;Make a funny video about cats learning Python&quot;
            </Text>
          </Box>
        ) : (
          messages.map((msg, i) => (
            <Box
              key={i}
              alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
              maxW="70%"
            >
              <Box
                bg={msg.role === 'user' ? 'blue.500' : 'white'}
                color={msg.role === 'user' ? 'white' : 'black'}
                p={3}
                borderRadius="lg"
                boxShadow="sm"
              >
                <Text whiteSpace="pre-wrap">{msg.content}</Text>
              </Box>
              {msg.model && (
                <HStack mt={1} spacing={2}>
                  <Badge colorScheme={currentMode?.color || 'gray'} fontSize="xs">
                    {msg.mode}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {msg.model.split('/').pop()}
                  </Text>
                </HStack>
              )}
            </Box>
          ))
        )}
        {isLoading && (
          <Box alignSelf="flex-start">
            <HStack spacing={2} bg="white" p={3} borderRadius="lg" boxShadow="sm">
              <Spinner size="sm" />
              <Text color="gray.500">AI is thinking...</Text>
            </HStack>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input */}
      <Box p={4} bg="white" borderTop="1px" borderColor="gray.200">
        <HStack spacing={2}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask the ${currentMode?.label.toLowerCase()}...`}
            size="lg"
            disabled={isLoading}
          />
          <IconButton
            aria-label="Send message"
            icon={<ArrowUpIcon />}
            colorScheme="blue"
            size="lg"
            onClick={sendMessage}
            isLoading={isLoading}
            disabled={!input.trim() || isLoading}
          />
        </HStack>
      </Box>
    </Flex>
  );
}
