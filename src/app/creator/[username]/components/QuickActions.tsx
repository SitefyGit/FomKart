'use client';

import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ShareIcon from '@mui/icons-material/Share';
import { ShareModal } from '@/components/ShareModal';

export interface QuickActionsProps {
  creator: {
    id: string;
    username: string;
    full_name: string;
  };
  currentUserId?: string | null;
  onMessage?: () => void;
  onSubscribe?: () => void;
  showMessage?: boolean;
  showShare?: boolean;
  showSubscribe?: boolean;
  variant?: 'horizontal' | 'vertical';
}

export default function QuickActions({
  creator,
  currentUserId,
  onMessage,
  onSubscribe,
  showMessage = true,
  showShare = true,
  showSubscribe = true,
  variant = 'horizontal',
}: QuickActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isOwner = currentUserId === creator.id;

  const buttonBase = 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-colors';
  const primaryButton = `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`;
  const secondaryButton = `${buttonBase} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600`;

  return (
    <>
      <div className={`flex ${variant === 'vertical' ? 'flex-col' : 'flex-row'} gap-3`}>
        {showMessage && !isOwner && (
          <button onClick={onMessage} className={primaryButton}>
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Message
          </button>
        )}

        {showSubscribe && !isOwner && (
          <button onClick={onSubscribe} className={secondaryButton}>
            Subscribe
          </button>
        )}

        {showShare && (
          <button onClick={() => setShareOpen(true)} className={secondaryButton}>
            <ShareIcon className="w-5 h-5" />
            Share
          </button>
        )}
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        username={creator.username}
        title={`Check out ${creator.full_name} on FomKart`}
      />
    </>
  );
}
