// src/app/core/models/confirmar-reserva.model.ts - MODELO COMPLETO
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
