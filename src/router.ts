import { createRouter, createWebHistory } from "vue-router";
import ParentPage from "./pages/ParentPage.vue";
import PlayPage from "./pages/PlayPage.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "parent", component: ParentPage },
    { path: "/play", name: "play", component: PlayPage }
  ]
});
