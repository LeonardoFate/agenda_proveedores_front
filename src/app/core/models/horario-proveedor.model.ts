// src/app/core/models/horario-proveedor.model.ts - COMPLETO ACTUALIZADO
import { DiaSemana } from './plantilla-horario.model'

export interface HorarioProveedor {
  fecha: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  tiempoDescarga: string;
  numeroPersonas: number;

  // ✅ CAMPOS OPCIONALES: IDs necesarios para confirmación (pueden ser null si no están asignados)
  areaId?: number;
  areaNombre?: string;
  andenId?: number;
  andenNumero?: number;
  tipoServicioId?: number;
  tipoServicioNombre?: string;

  // Estados de reserva
  tieneReserva: boolean;
  reservaId?: number;
  estadoReserva?: string;

  // Para mostrar si puede confirmar
  puedeConfirmar: boolean;
}
