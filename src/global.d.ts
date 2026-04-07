/// <reference types="next/types/global" />

declare module '*.css' {
	const content: { readonly [className: string]: string };
	export default content;
}

declare module '@/app/globals.css';