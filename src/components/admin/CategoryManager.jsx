import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, Layers, Tag } from 'lucide-react'
import { db } from '../../lib/firebaseClient'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import useCategories from '../../hooks/useCategories'
import toast from 'react-hot-toast'

const CategoryManager = () => {
  const { categories, loading } = useCategories()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      toast.error('Ingresa un nombre para la categoría')
      return
    }

    // Check if category already exists with identical name
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      toast.error('Ya existe una categoría con ese nombre')
      return
    }

    setCreating(true)

    try {
      if (!db) throw new Error('Firestore no está inicializado')

      const slug = trimmed
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      await addDoc(collection(db, 'categories'), {
        name: trimmed,
        slug,
        sort_order: categories.length + 1,
        is_active: true,
        created_at: serverTimestamp(),
      })

      setNewCategoryName('')
      toast.success(`Categoría "${trimmed}" creada con éxito`, { icon: '✨' })
    } catch (err) {
      console.error('Error al crear categoría:', err)
      toast.error('Error al guardar la categoría en Firestore')
    } finally {
      setCreating(false)
    }
  }

  // Save edited category name
  const handleSaveEdit = async (cat) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setUpdatingId(cat.id)
    try {
      if (db) {
        const slug = trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')

        await updateDoc(doc(db, 'categories', cat.id), {
          name: trimmed,
          slug,
        })
      }
      toast.success('Categoría actualizada')
      setEditingId(null)
    } catch (err) {
      console.error('Error al actualizar categoría:', err)
      toast.error('Error al actualizar categoría')
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete category
  const handleDelete = async (cat) => {
    setUpdatingId(cat.id)
    try {
      if (db) {
        await deleteDoc(doc(db, 'categories', cat.id))
      }
      toast.success(`Categoría "${cat.name}" eliminada`)
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Error al eliminar categoría:', err)
      toast.error('Error al eliminar categoría')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6 font-sans'>
      {/* Create new category card */}
      <div className='bg-gray-900/80 border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400'>
            <Layers size={18} />
          </div>
          <div>
            <h3 className='text-gray-100 font-semibold text-lg'>Crear Nueva Categoría</h3>
            <p className='text-gray-500 text-xs mt-0.5'>
              Las categorías aparecerán en los filtros de la tienda y al subir prendas.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateCategory} className='flex flex-col sm:flex-row gap-3 pt-2'>
          <div className='relative flex-1'>
            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500'>
              <Tag size={16} />
            </div>
            <input
              type='text'
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder='Ej: Vestidos de Gala, Accesorios, Denim...'
              className='form-input pl-10 text-sm py-3 font-sans'
            />
          </div>

          <button
            type='submit'
            disabled={creating || !newCategoryName.trim()}
            className='btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 shrink-0 font-sans'
          >
            {creating ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <Plus size={16} />
            )}
            <span>{creating ? 'Creando...' : 'Crear Categoría'}</span>
          </button>
        </form>
      </div>

      {/* Existing categories list */}
      <div className='bg-gray-900/60 border border-gray-800/80 rounded-3xl p-6 sm:p-7 shadow-xl'>
        <div className='flex items-center justify-between pb-4 border-b border-gray-800 mb-4'>
          <h4 className='text-gray-200 font-semibold text-sm'>
            Categorías Activas ({categories.length})
          </h4>
          <span className='text-gray-500 text-xs'>
            Sincronizadas con la tienda en tiempo real
          </span>
        </div>

        {loading ? (
          <div className='py-8 flex justify-center'>
            <Loader2 size={24} className='animate-spin text-brand-400' />
          </div>
        ) : categories.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-gray-500 text-sm'>Aún no has creado categorías personalizadas.</p>
          </div>
        ) : (
          <div className='space-y-2.5'>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className='flex items-center justify-between bg-gray-850/60 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700/80 rounded-2xl p-3.5 transition-all'
              >
                {/* Category name or inline edit form */}
                {editingId === cat.id ? (
                  <div className='flex items-center gap-2 flex-1 mr-2'>
                    <input
                      type='text'
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(cat)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      className='form-input py-1.5 px-3 text-sm font-sans'
                    />
                    <button
                      onClick={() => handleSaveEdit(cat)}
                      disabled={updatingId === cat.id}
                      className='p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors shrink-0'
                      title='Guardar'
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className='p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors shrink-0'
                      title='Cancelar'
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='w-2 h-2 rounded-full bg-brand-400' />
                    <div>
                      <p className='text-gray-100 font-medium text-sm'>{cat.name}</p>
                      {cat.slug && (
                        <p className='text-gray-600 text-[11px] font-sans'>
                          filtro: #{cat.slug}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action controls */}
                {editingId !== cat.id && (
                  <div className='flex items-center gap-1.5 shrink-0'>
                    {deleteConfirmId === cat.id ? (
                      <div className='flex items-center gap-1 bg-red-950/40 border border-red-500/30 rounded-xl p-1 animate-fade-in'>
                        <span className='text-red-400 text-xs px-1 font-medium'>¿Borrar?</span>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={updatingId === cat.id}
                          className='p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors'
                          title='Confirmar eliminación'
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className='p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors'
                          title='Cancelar'
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(cat.id)
                            setEditingName(cat.name)
                          }}
                          className='p-2 text-gray-400 hover:text-brand-300 hover:bg-brand-500/10 rounded-xl transition-colors'
                          title='Editar nombre'
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className='p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors'
                          title='Eliminar categoría'
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryManager
