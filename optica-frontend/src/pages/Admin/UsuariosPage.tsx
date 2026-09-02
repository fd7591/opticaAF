import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Modal, Spinner, Badge } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { UserPlus, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { opticasApi } from '../../api/opticas';
import { sucursalesApi } from '../../api/sucursales';
import type { Optica, Sucursal } from '../../types';

interface UsuarioDto {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
  opticaId?: number;
  sucursalId?: number;
  nombreOptica?: string;
  nombreSucursal?: string;
}

interface CrearForm {
  nombreUsuario: string;
  nombreCompleto: string;
  password: string;
  rol: string;
  opticaId?: number;
  sucursalId?: number;
}

interface CambiarPwdForm {
  passwordActual: string;
  nuevoPassword: string;
  confirmar: string;
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { user: me, isSuperAdmin } = useAuth();
  const [modal, setModal] = useState<'crear' | 'password' | null>(null);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState('Operador');

  const { data: usuarios, isLoading } = useQuery<UsuarioDto[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/api/auth/usuarios').then(r => r.data),
  });

  const { data: opticas } = useQuery<Optica[]>({
    queryKey: ['opticas'],
    queryFn: opticasApi.getAll,
    enabled: isSuperAdmin,
  });

  const { data: sucursales } = useQuery<Sucursal[]>({
    queryKey: ['sucursales'],
    queryFn: () => sucursalesApi.getAll(),
  });

  const crearMut = useMutation({
    mutationFn: (data: CrearForm) => api.post('/api/auth/usuarios', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setModal(null); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => api.patch(`/api/auth/usuarios/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const pwdMut = useMutation({
    mutationFn: (data: { passwordActual: string; nuevoPassword: string }) =>
      api.post('/api/auth/cambiar-password', data),
    onSuccess: () => { setPwdOk(true); setPwdError(''); },
    onError: (e: any) => setPwdError(e.message),
  });

  const crearForm = useForm<CrearForm>({ defaultValues: { rol: 'Operador' } });
  const pwdForm = useForm<CambiarPwdForm>();

  const onCrear = (data: CrearForm) => crearMut.mutate(data);

  const onCambiarPwd = (data: CambiarPwdForm) => {
    if (data.nuevoPassword !== data.confirmar) {
      setPwdError('Las contraseñas no coinciden.');
      return;
    }
    if (data.nuevoPassword.length < 8) {
      setPwdError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    pwdMut.mutate({ passwordActual: data.passwordActual, nuevoPassword: data.nuevoPassword });
  };

  const rolColor = (rol: string) =>
    rol === 'SuperAdmin' ? 'red' : rol === 'Admin' ? 'blue' : 'gray';

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Usuarios del sistema</h2>
          <p className="text-sm text-gray-500">Gestión de acceso y permisos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPwdOk(false); setPwdError(''); pwdForm.reset(); setModal('password'); }} className="btn-secondary">
            <KeyRound className="w-4 h-4" />
            Mi contraseña
          </button>
          <button onClick={() => { crearForm.reset({ rol: 'Operador' }); setRolSeleccionado('Operador'); setModal('crear'); }} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Rol</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Óptica / Sucursal</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Último acceso</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="w-5 h-5 text-primary-500 mx-auto" /></td></tr>
            )}
            {usuarios?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.nombreCompleto}</p>
                  <p className="text-xs text-gray-500 font-mono">@{u.nombreUsuario}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge label={u.rol} color={rolColor(u.rol) as any} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                  {u.nombreOptica && <p>{u.nombreOptica}</p>}
                  {u.nombreSucursal && <p className="text-gray-400">{u.nombreSucursal}</p>}
                  {!u.nombreOptica && <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                  {u.ultimoAcceso ? format(new Date(u.ultimoAcceso), 'dd/MM/yyyy HH:mm') : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge label={u.activo ? 'Activo' : 'Inactivo'} color={u.activo ? 'green' : 'red'} />
                </td>
                <td className="px-4 py-3 text-right">
                  {u.nombreUsuario !== me?.nombreUsuario && (
                    <button
                      onClick={() => toggleMut.mutate(u.id)}
                      disabled={toggleMut.isPending}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={u.activo ? 'Desactivar' : 'Activar'}
                    >
                      {u.activo
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Crear usuario modal */}
      <Modal open={modal === 'crear'} onClose={() => setModal(null)} title="Nuevo usuario" size="sm">
        <form onSubmit={crearForm.handleSubmit(onCrear)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario *</label>
            <input {...crearForm.register('nombreUsuario', { required: true })} className="input-field" placeholder="juan.garcia" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input {...crearForm.register('nombreCompleto', { required: true })} className="input-field" placeholder="Juan García" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
            <input {...crearForm.register('password', { required: true, minLength: 8 })} type="password" className="input-field" placeholder="Mínimo 8 caracteres" />
            {crearForm.formState.errors.password && <p className="text-xs text-red-500 mt-1">Mínimo 8 caracteres</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              {...crearForm.register('rol', { onChange: e => setRolSeleccionado(e.target.value) })}
              className="input-field"
            >
              <option value="Operador">Operador</option>
              <option value="Admin">Administrador</option>
              {isSuperAdmin && <option value="SuperAdmin">Super Administrador</option>}
            </select>
          </div>
          {isSuperAdmin && rolSeleccionado !== 'SuperAdmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Óptica</label>
              <select {...crearForm.register('opticaId', { setValueAs: v => v === '' ? undefined : Number(v) })} className="input-field">
                <option value="">Sin asignar</option>
                {opticas?.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>
          )}
          {rolSeleccionado === 'Operador' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <select {...crearForm.register('sucursalId', { setValueAs: v => v === '' ? undefined : Number(v) })} className="input-field">
                <option value="">Sin asignar</option>
                {sucursales?.filter(s => s.activo).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {crearMut.error && <p className="text-sm text-red-600">{(crearMut.error as any).message}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={crearMut.isPending} className="btn-primary">
              {crearMut.isPending && <Spinner className="w-4 h-4" />}
              Crear usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Cambiar contraseña modal */}
      <Modal open={modal === 'password'} onClose={() => setModal(null)} title="Cambiar contraseña" size="sm">
        {pwdOk ? (
          <div className="text-center py-4">
            <p className="text-emerald-600 font-medium">Contraseña actualizada correctamente.</p>
            <button onClick={() => setModal(null)} className="btn-primary mt-4">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={pwdForm.handleSubmit(onCambiarPwd)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input {...pwdForm.register('passwordActual', { required: true })} type="password" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input {...pwdForm.register('nuevoPassword', { required: true, minLength: 8 })} type="password" className="input-field" placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input {...pwdForm.register('confirmar', { required: true })} type="password" className="input-field" />
            </div>
            {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={pwdMut.isPending} className="btn-primary">
                {pwdMut.isPending && <Spinner className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
