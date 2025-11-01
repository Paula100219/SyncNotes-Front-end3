import { useEffect, useState } from "react";

import styled, { keyframes } from "styled-components";

import Navbar from "../components/Navbar";

import { useNavigate } from "react-router-dom";

const BASE = "http://localhost:8081";

const getToken = () => localStorage.getItem("token") || "";

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const fadeIn = keyframes`
from {
opacity: 0;
transform: translateY(20px);
}
to {
opacity: 1;
transform: translateY(0);
}
`;

const PerfilContainer = styled.div`

margin-top: 100px;

padding: 2rem;

display: flex;

justify-content: center;

align-items: flex-start;

color: #e5e7eb;

background: radial-gradient(circle at top, #0d1117 0%, #0b0f19 80%);

min-height: 100vh;

`;

const PerfilCard = styled.div`

background: rgba(17, 24, 39, 0.95);

border: 1px solid rgba(255, 255, 255, 0.08);

border-radius: 18px;

padding: 3rem 3.5rem;

width: 100%;

max-width: 850px;

box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45),

0 0 12px rgba(37, 99, 235, 0.1);

backdrop-filter: blur(10px);

animation: ${fadeIn} 0.3s ease;

display: flex;

flex-direction: column;

gap: 2rem;

`;

const Header = styled.div`

display: flex;

align-items: center;

gap: 1.5rem;

margin-bottom: 2rem;

`;

const Avatar = styled.div`

width: 90px;

height: 90px;

border-radius: 50%;

background: linear-gradient(145deg, #1e293b, #0f172a);

display: flex;

align-items: center;

justify-content: center;

font-size: 2.2rem;

font-weight: bold;

color: #60a5fa;

`;

const Info = styled.div`

display: flex;

flex-direction: column;

h2 {

font-size: 1.6rem;

color: #e2e8f0;

margin: 0;

}

span {

color: #9ca3af;

}

`;

const Section = styled.div`

margin-top: 2rem;

`;

const SectionTitle = styled.h3`

color: #60a5fa;

font-size: 1.1rem;

margin-bottom: 1rem;

`;

const ButtonRow = styled.div`

display: flex;

flex-wrap: wrap;

gap: 1rem;

`;

const Button = styled.button`

background-color: ${(props) => props.color || "#2563eb"};

color: white;

border: none;

padding: 0.7rem 1.2rem;

border-radius: 8px;

cursor: pointer;

font-weight: 600;

transition: background 0.2s ease;

flex: 1;

&:hover {

opacity: 0.9;

}

`;

export default function Perfil() {

const [user, setUser] = useState(null);

const navigate = useNavigate();

const fetchPerfil = async () => {

try {

const res = await fetch(`${BASE}/api/auth/me`, { headers: authHeader() });

if (!res.ok) throw new Error("Error al obtener el perfil");

const data = await res.json();

setUser(data?.user || data);

} catch (err) {

alert(err.message || "Error cargando el perfil");

}

};

useEffect(() => {

fetchPerfil();

}, []);

if (!user) {

return (

<PerfilContainer>

<p>Cargando perfil...</p>

</PerfilContainer>

);

}

return (

<>

<Navbar variant="dashboard" />

<PerfilContainer>

<PerfilCard>

<Header>

<Avatar>{user.name?.charAt(0).toUpperCase()}</Avatar>

<Info>

<h2>{user.name}</h2>

<span>@{user.username}</span>

</Info>

</Header>



</PerfilCard>

<Section>

<SectionTitle>Acciones de cuenta</SectionTitle>

<ButtonRow>

<Button onClick={() => navigate("/actualizar-usuario")} color="#2563eb">

Actualizar usuario

</Button>

<Button onClick={() => navigate("/eliminar-usuario")} color="#dc2626">

Eliminar usuario

</Button>

<Button

onClick={() => {

localStorage.removeItem("token");

navigate("/login");

}}

color="#6b7280"

>

Cerrar sesión

</Button>

</ButtonRow>

</Section>

</PerfilContainer>

</>

);

}