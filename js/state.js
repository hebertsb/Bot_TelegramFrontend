// js/state.js
// Variables de estado compartidas

export let cart = [];
export let myOrders = JSON.parse(localStorage.getItem("myOrders")) || [];
export let currentRating = 0;
export let userLocation = null;
export let userChatId = null;
