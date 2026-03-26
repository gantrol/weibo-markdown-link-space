import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: preprocess(),

  kit: {
    adapter: adapter({
      fallback: 'index.html'
    }),
    prerender: {
      entries: [] // 不 prerender 页面
    }
  }
};
