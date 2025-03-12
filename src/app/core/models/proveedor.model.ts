// src/app/features/core/models/proveedor.model.ts
export interface Proveedor {
    id: number;
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
    estado: boolean;
    usuarioId?: number;
  }
