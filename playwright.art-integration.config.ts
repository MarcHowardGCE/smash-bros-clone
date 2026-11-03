import{defineConfig}from"@playwright/test";
export default defineConfig({testDir:"./apps/client/e2e",testMatch:["fighter-art-review.spec.ts","multiplayer-atlas.spec.ts"],workers:1,timeout:120000,use:{baseURL:"http://127.0.0.1:5193",headless:true,viewport:{width:1280,height:1080}},reporter:"list"});
