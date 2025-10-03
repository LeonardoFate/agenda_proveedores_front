// src/app/features/auth/privacy-policy-modal/privacy-policy-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" (click)="close()"></div>

        <!-- Modal -->
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-2xl leading-6 font-bold text-gray-900 mb-4" id="modal-title">
                  Política de Protección de Datos Personales y Términos de Uso
                </h3>
                
                <div class="mt-4 max-h-96 overflow-y-auto px-4 py-3 bg-gray-50 rounded-lg">
                  <!-- POLÍTICA DE PROTECCIÓN DE DATOS -->
                  <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">POLÍTICA DE PROTECCIÓN DE DATOS PERSONALES</h4>
                    
                    <p class="text-sm text-gray-700 mb-4">
                      En cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador, 
                      informamos que los datos personales proporcionados por los usuarios de esta plataforma 
                      serán tratados conforme a los principios de confidencialidad, legalidad, lealtad y transparencia.
                    </p>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">1. Datos recolectados</h5>
                    <p class="text-sm text-gray-700 mb-2">Recopilamos los siguientes datos personales al registrarse o utilizar esta aplicación:</p>
                    <ul class="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
                      <li>Nombres y apellidos</li>
                      <li>Cédula de identidad</li>
                      <li>Teléfono de contacto</li>
                      <li>Correo electrónico</li>
                      <li>Datos de acceso a planta y visitas realizadas</li>
                      <li>Datos de Vehículos</li>
                    </ul>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">2. Finalidad del tratamiento</h5>
                    <p class="text-sm text-gray-700 mb-2">La información será utilizada con las siguientes finalidades:</p>
                    <ul class="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
                      <li>Registro y validación de proveedores</li>
                      <li>Agendamiento y control de accesos a la planta</li>
                      <li>Cumplimiento de requisitos legales y de seguridad</li>
                      <li>Comunicación de cambios en las políticas o requerimientos</li>
                    </ul>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">3. Almacenamiento y seguridad</h5>
                    <p class="text-sm text-gray-700 mb-4">
                      Sus datos serán almacenados de forma segura en servidores controlados y 
                      protegidos por mecanismos de autenticación y cifrado.
                    </p>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">4. Cesión de datos a terceros</h5>
                    <p class="text-sm text-gray-700 mb-4">
                      Los datos podrán ser compartidos exclusivamente con el personal de seguridad y sistemas 
                      del Grupo KFC con el fin de controlar los accesos y validar la identidad de los proveedores.
                    </p>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">5. Derechos del titular</h5>
                    <p class="text-sm text-gray-700 mb-2">Usted tiene derecho a:</p>
                    <ul class="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
                      <li>Acceder a sus datos personales</li>
                      <li>Rectificar o actualizar su información</li>
                      <li>Solicitar la eliminación de sus datos, en los casos que lo permita la ley</li>
                    </ul>
                    <p class="text-sm text-gray-700 mb-4">
                      Para ejercer sus derechos, comuníquese al correo: 
                      <a href="mailto:tommy.miranda@kfc.com.ec" class="text-red-600 hover:text-red-800 font-medium">tommy.miranda&#64;kfc.com.ec</a>
                    </p>
                  </div>

                  <!-- TÉRMINOS Y CONDICIONES -->
                  <div class="border-t pt-4">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">TÉRMINOS Y CONDICIONES DE USO</h4>
                    
                    <p class="text-sm text-gray-700 mb-4">
                      Este documento establece los términos y condiciones aplicables al uso de la plataforma 
                      web para proveedores de planta del Grupo KFC.
                    </p>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">1. Aceptación</h5>
                    <p class="text-sm text-gray-700 mb-4">
                      Al registrarse o utilizar esta plataforma, el proveedor acepta plenamente los términos aquí descritos.
                    </p>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">2. Uso del sistema</h5>
                    <ul class="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
                      <li>El proveedor se compromete a utilizar la plataforma únicamente para fines de agendamiento y control de accesos autorizados.</li>
                      <li>Está prohibido suplantar identidades, falsificar información o acceder sin autorización.</li>
                    </ul>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">3. Responsabilidades</h5>
                    <ul class="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
                      <li>La plataforma no se responsabiliza por información inexacta ingresada por el proveedor.</li>
                      <li>El proveedor es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
                    </ul>

                    <h5 class="text-md font-semibold text-gray-800 mb-2">4. Modificaciones</h5>
                    <p class="text-sm text-gray-700 mb-4">
                      Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                      Se notificará a los usuarios para su aceptación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              (click)="accept()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Acepto los Términos y Política de Privacidad
            </button>
            <button
              type="button"
              (click)="close()"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrivacyPolicyModalComponent {
  @Input() isOpen = false;
  @Output() accepted = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  accept() {
    this.accepted.emit(true);
  }

  close() {
    this.closed.emit();
  }
}