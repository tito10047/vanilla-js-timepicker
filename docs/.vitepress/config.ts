import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'vanilla-js-timepicker',
  description: 'Lightweight, dependency-free time picker for vanilla JavaScript and TypeScript.',
  base: '/vanilla-js-timepicker/',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,

  rewrites: {
    'v0.1.0/:path*': ':path*'
  },

  head: [
    ['meta', { name: 'theme-color', content: '#4361ee' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'vanilla-js-timepicker' }],
    ['meta', {
      property: 'og:description',
      content: 'Lightweight, dependency-free time picker for vanilla JavaScript and TypeScript.',
    }],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Cookbook', link: '/cookbook/' },
      { text: 'API', link: '/api/' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/tito10047/vanilla-js-timepicker/releases' },
        ],
      },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/tito10047/vanilla-js-timepicker' },
          { text: 'npm', link: 'https://www.npmjs.com/package/vanilla-js-timepicker' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Essentials',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Initialization & Options', link: '/guide/initialization' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Public API', link: '/guide/public-api' },
            { text: 'Events', link: '/guide/events' },
            { text: 'Time Formats', link: '/guide/formats' },
            { text: 'Parse Strategies', link: '/guide/parsing' },
          ],
        },
        {
          text: 'Customization',
          items: [
            { text: 'Theming & CSS Variables', link: '/guide/theming' },
            { text: 'Internationalization', link: '/guide/i18n' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Accessibility', link: '/guide/accessibility' },
            { text: 'TypeScript', link: '/guide/typescript' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
      '/cookbook/': [
        {
          text: 'Cookbook',
          items: [
            { text: 'Overview', link: '/cookbook/' },
            { text: 'Async Validation', link: '/cookbook/validation' },
            { text: 'Min / Max Time', link: '/cookbook/min-max' },
            { text: 'Programmatic Control', link: '/cookbook/programmatic' },
            { text: 'Custom Locale', link: '/cookbook/custom-locale' },
            { text: 'Auto-Init via data attribute', link: '/cookbook/data-init' },
            { text: 'Before-open / before-change Guards', link: '/cookbook/guard' },
            { text: 'Cell Renderer', link: '/cookbook/render-cell' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tito10047/vanilla-js-timepicker' },
    ],

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/tito10047/vanilla-js-timepicker/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 tito10047',
    },
  },
})
