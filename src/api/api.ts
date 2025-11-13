import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL; 

const api = axios.create({

baseURL: API_BASE,

timeout: 15000,

withCredentials: false, // no se usan cookies

headers: {

"Content-Type": "application/json",

},

});