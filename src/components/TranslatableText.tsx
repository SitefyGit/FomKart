'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { inferSourceLanguage, normalizeLanguageCode } from '@/lib/language';

type TextTag = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3';

interface TranslatableTextProps {
  text: string;
  as?: TextTag;
  wrapperAs?: 'div' | 'span';
  className?: string;
  sourceLanguage?: string;
  showListingControls?: boolean;
  manualToggle?: boolean;
  translationButtonClassName?: string;
  containerClassName?: string;
}

export function TranslatableText({
  text,
  as = 'p',
  wrapperAs = 'div',
  className,
  sourceLanguage,
  showListingControls = false,
  manualToggle = false,
  translationButtonClassName,
  containerClassName,
}: TranslatableTextProps) {
  const {
    language,
    t,
    translateText,
    showOriginalListings,
    setShowOriginalListings,
  } = useLanguage();

  const [translated, setTranslated] = useState<string>(text);
  const [localShowOriginal, setLocalShowOriginal] = useState(false);

  const inferredSource = useMemo(
    () => normalizeLanguageCode(sourceLanguage ?? inferSourceLanguage(text)),
    [sourceLanguage, text],
  );

  const useLocalToggle = manualToggle && !showListingControls;
  const showOriginal = useLocalToggle ? localShowOriginal : showOriginalListings;

  const shouldTranslate = !!text?.trim() && language !== inferredSource && !showOriginal;

  useEffect(() => {
    let mounted = true;

    if (!shouldTranslate) {
      setTranslated(text);
      return;
    }

    translateText(text, { sourceLanguage: inferredSource }).then((result) => {
      if (!mounted) return;
      setTranslated(result || text);
    });

    return () => {
      mounted = false;
    };
  }, [text, inferredSource, shouldTranslate, translateText]);

  const displayedText = shouldTranslate ? translated : text;
  const Tag = as;
  const Wrapper = wrapperAs;

  const showMeta = (showListingControls || manualToggle) && language !== inferredSource;
  const buttonClass = translationButtonClassName
    ?? 'text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300';
  const MetaContainer = Wrapper === 'span' ? 'span' : 'div';

  return (
    <Wrapper className={containerClassName}>
      {showMeta && (
        <MetaContainer className="mb-1 flex flex-wrap items-center gap-2">
          {showListingControls && !showOriginal && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('automaticTranslation', 'Automatic translation')} - {t('translatedFrom', 'Translated from')} {inferredSource.toUpperCase()}
            </span>
          )}
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              if (useLocalToggle) {
                setLocalShowOriginal((prev) => !prev);
                return;
              }
              setShowOriginalListings(!showOriginalListings);
            }}
          >
            {(useLocalToggle ? localShowOriginal : showOriginalListings)
              ? t('viewTranslation', 'View translation')
              : t('viewOriginal', 'View original')}
          </button>
        </MetaContainer>
      )}
      <Tag className={className}>{displayedText}</Tag>
    </Wrapper>
  );
}
