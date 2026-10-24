import {defineConfig} from 'vite';
export default defineConfig({base:'./',css:{postcss:{plugins:[]}},server:{host:'127.0.0.1',port:5178},build:{target:'es2022'}});
