"use client";
import React from 'react';
import { FaTiktok, FaYoutube, FaSpotify, FaAmazon, FaMusic, FaInstagram, FaFacebook } from 'react-icons/fa';

interface SocialIconsBarProps {
  links?: Record<string,string | undefined>;
  className?: string;
  size?: number;
}

const iconMap: { key: string; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { key: 'tiktok', Icon: FaTiktok, label: 'TikTok' },
  { key: 'youtube', Icon: FaYoutube, label: 'YouTube' },
  { key: 'spotify', Icon: FaSpotify, label: 'Spotify' },
  { key: 'amazon', Icon: FaAmazon, label: 'Amazon' },
  { key: 'music', Icon: FaMusic, label: 'Music' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'facebook', Icon: FaFacebook, label: 'Facebook' },
];

export function SocialIconsBar({ links = {}, className = '', size = 20 }: SocialIconsBarProps) {
  const active = iconMap.filter(i => links[i.key]);
  if (active.length === 0) return null;
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {active.map(({ key, Icon, label }) => (
        <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-gray-500 hover:text-gray-900 transition-colors">
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
