// src/app/core/models/confirmar-reserva.model.ts - MODELO ACTUALIZADO

import { Ayudante } from './reserva.model';

export interface ConfirmarReservaRequest {
  // Datos del transporte (obligatorios)
  conductorNombres: string;
  conductorApellidos: string;
  conductorCedula: string;
  transportePlaca: string;
  transporteTipo: string;
  transporteMarca: string;
  transporteModelo: string;

  // Datos opcionales
  transporteCapacidad?: string;
  observaciones?: string;
  numeroPalets?: number;
  ayudantes?: Ayudante[];
}

export interface ConfirmarReservaResponse {
  id: number;
  mensaje: string;
  reserva: {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: string;
    areaNombre: string;
    andenNumero: number;
    tipoServicioNombre: string;
  };
}

// ✅ MODELO ACTUALIZADO - Con proveedorId requerido
export interface ReservaDTO {
  // ✅ NUEVO CAMPO REQUERIDO
  proveedorId: number;

  // Datos de la plantilla (no modificables)
  fecha: string;
  horaInicio: string;
  horaFin: string;
  areaId: number;
  andenId: number;
  tipoServicioId: number;

  // Datos del vehículo
  transporteTipo: string;
  transporteMarca: string;
  transporteModelo: string;
  transportePlaca: string;
  transporteCapacidad?: string;

  // Datos del conductor
  conductorNombres: string;
  conductorApellidos: string;
  conductorCedula: string;

  // Datos opcionales
  descripcion?: string;
  numeroPalets?: number;
  ayudantes?: Ayudante[];
}
