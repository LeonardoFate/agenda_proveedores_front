// src/app/core/models/anden.model.ts
// Actualiza este archivo para incluir la enumeración

export enum EstadoAnden {
    DISPONIBLE = 'DISPONIBLE',
    OCUPADO = 'OCUPADO',
    ALMUERZO = 'ALMUERZO',
    DESCANSO = 'DESCANSO',
    NO_DISPONIBLE = 'NO_DISPONIBLE'
  }

  export interface Anden {
    id: number;
    areaId: number;
    areaNombre: string;
    numero: number;
    estado: string;
    capacidad: string;
    exclusivoContenedor: boolean;
  }
