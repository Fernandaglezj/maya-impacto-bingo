import type { AppProps } from 'next/app';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from "@/components/ui/toaster";
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Component {...pageProps} />
      <Toaster />
    </DndProvider>
  );
} 