import { EstadoReserva } from '../../core/models/reserva.model';

export class EstadoReservaUtils {
  static getStatusColor(estado: EstadoReserva): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE_CONFIRMACION:
        return 'warning';
      case EstadoReserva.CONFIRMADA:
        return 'info';
      case EstadoReserva.PENDIENTE:
        return 'secondary';
      case EstadoReserva.EN_PLANTA:
        return 'primary';
      case EstadoReserva.EN_RECEPCION:
        return 'primary';
      case EstadoReserva.COMPLETADA:
        return 'success';
      case EstadoReserva.CANCELADA:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  static getStatusLabel(estado: EstadoReserva): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE_CONFIRMACION:
        return 'Pendiente Confirmación';
      case EstadoReserva.CONFIRMADA:
        return 'Confirmada';
      case EstadoReserva.PENDIENTE:
        return 'Pendiente';
      case EstadoReserva.EN_PLANTA:
        return 'En Planta';
      case EstadoReserva.EN_RECEPCION:
        return 'En Recepción';
      case EstadoReserva.COMPLETADA:
        return 'Completada';
      case EstadoReserva.CANCELADA:
        return 'Cancelada';
      default:
        return estado;
    }
  }

  static canProviderEdit(estado: EstadoReserva): boolean {
    return estado === EstadoReserva.PENDIENTE_CONFIRMACION ||
           estado === EstadoReserva.CONFIRMADA;
  }

  static canProviderCancel(estado: EstadoReserva): boolean {
    return estado === EstadoReserva.PENDIENTE_CONFIRMACION ||
           estado === EstadoReserva.CONFIRMADA;
  }
}
