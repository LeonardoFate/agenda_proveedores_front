export interface User {
    id: number;
    username: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: 'ADMIN' | 'GUARDIA' | 'AGENTE' | 'PROVEEDOR';
    estado: boolean;
  }

  export interface LoginRequest {
    username: string;
    password: string;
  }

  export interface LoginResponse {
    token: string;
    tipo: string;
    id: number;
    username: string;
    email: string;
    rol: string;
  }

  export interface RegisterProviderRequest {
    username: string;
    password: string;
    email: string;
    nombre: string;
    apellido: string;
    nombreEmpresa: string;
    ruc: string;
    direccion: string;
    telefono: string;
  }

  export interface RegisterUserRequest {
    username: string;
    password: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  }
