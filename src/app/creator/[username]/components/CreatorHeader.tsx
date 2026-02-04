'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPinIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { SocialIconsBar } from '@/components/SocialIconsBar';

export interface CreatorHeaderProps {
  creator: {
    id: string;
    username: string;
    full_name: string;
    bio?: string;
    avatar_url?: string;
    background_image?: string;
    location?: string;
    website?: string;
    social_links?: Record<string, string>;
    is_verified?: boolean;
    totalProducts?: number;
    created_at: string;
  };
  variant?: 'full' | 'compact';
  showCover?: boolean;
  showStats?: boolean;
  currentPage?: 'store' | 'bio';
}

export default function CreatorHeader({
  creator,
  variant = 'full',
  showCover = true,
  showStats = true,
  currentPage = 'store',
}: CreatorHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? '' : 'relative'}>
      {/* Cover Image */}
      {showCover && !isCompact && (
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-emerald-600 to-teal-500 overflow-hidden">
          {creator.background_image && (
            <Image
              src={creator.background_image}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Profile Card */}
      <div
        className={
          isCompact
            ? 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
            : 'relative -mt-20 mx-4 md:mx-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8'
        }
      >
        <div className={isCompact ? 'max-w-7xl mx-auto px-4 py-4 flex items-center gap-4' : ''}>
          {/* Avatar */}
          <div className={isCompact ? 'shrink-0' : 'flex flex-col md:flex-row md:items-start gap-6'}>
            <div
              className={`relative ${
                isCompact ? 'w-12 h-12' : 'w-24 h-24 md:w-32 md:h-32'
              } rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-lg mx-auto md:mx-0 shrink-0`}
            >
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {creator.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {!isCompact && (
              <div className="flex-1 text-center md:text-left">
                {/* Name & Verification */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {creator.full_name}
                  </h1>
                  {creator.is_verified && (
                    <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                  )}
                </div>

                {/* Username */}
                <p className="text-gray-500 dark:text-gray-400 mb-3">@{creator.username}</p>

                {/* Bio */}
                {creator.bio && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-xl">{creator.bio}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {creator.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {creator.location}
                    </span>
                  )}
                  {creator.website && (
                    <a
                      href={creator.website.startsWith('http') ? creator.website : `https://${creator.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-600 hover:underline"
                    >
                      <LinkIcon className="w-4 h-4" />
                      {creator.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span>
                    Joined {new Date(creator.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Social Links */}
                {creator.social_links && Object.keys(creator.social_links).length > 0 && (
                  <div className="mb-4">
                    <SocialIconsBar links={creator.social_links} />
                  </div>
                )}

                {/* Stats */}
                {showStats && (
                  <div className="flex items-center justify-center md:justify-start gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {creator.totalProducts ?? 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Products</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact variant info */}
          {isCompact && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {creator.full_name}
                </h1>
                {creator.is_verified && (
                  <CheckBadgeIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{creator.username}</p>
            </div>
          )}

          {/* Page Navigation Tabs */}
          {isCompact && (
            <nav className="flex items-center gap-1 ml-auto">
              <Link
                href={`/creator/${creator.username}`}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'store'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Store
              </Link>
              <Link
                href={`/creator/${creator.username}/bio`}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'bio'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Bio
              </Link>
            </nav>
          )}
        </div>

        {/* Full variant navigation */}
        {!isCompact && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center md:justify-start gap-4">
            <Link
              href={`/creator/${creator.username}`}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                currentPage === 'store'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              View Store
            </Link>
            <Link
              href={`/creator/${creator.username}/bio`}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                currentPage === 'bio'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              View Bio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
