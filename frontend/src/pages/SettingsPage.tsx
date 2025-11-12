import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useEvents,
  useCategories,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useSettings'
import type { Event, Category } from '@/types/api.types'

type SettingItem = Event | Category
type SettingType = 'event' | 'category'

interface FormData {
  key: string
  label: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingType>('event')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SettingItem | null>(null)
  const [formData, setFormData] = useState<FormData>({ key: '', label: '' })

  // Fetch data
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

  // Mutations
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const isLoading = eventsLoading || categoriesLoading

  // Handlers
  const handleOpenCreateModal = () => {
    setFormData({ key: '', label: '' })
    setIsCreateModalOpen(true)
  }

  const handleOpenEditModal = (item: SettingItem) => {
    setSelectedItem(item)
    setFormData({ key: item.key, label: item.label })
    setIsEditModalOpen(true)
  }

  const handleOpenDeleteModal = (item: SettingItem) => {
    setSelectedItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedItem(null)
    setFormData({ key: '', label: '' })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (activeTab === 'event') {
      await createEvent.mutateAsync(formData)
    } else {
      await createCategory.mutateAsync(formData)
    }

    handleCloseModals()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedItem) return

    const updateData = { label: formData.label }

    if (activeTab === 'event') {
      await updateEvent.mutateAsync({ id: selectedItem.id, data: updateData })
    } else {
      await updateCategory.mutateAsync({ id: selectedItem.id, data: updateData })
    }

    handleCloseModals()
  }

  const handleToggleActive = async (item: SettingItem) => {
    const newIsActive = item.isActive === 'true' ? 'false' : 'true'

    if (activeTab === 'event') {
      await updateEvent.mutateAsync({ id: item.id, data: { isActive: newIsActive } })
    } else {
      await updateCategory.mutateAsync({ id: item.id, data: { isActive: newIsActive } })
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    if (activeTab === 'event') {
      await deleteEvent.mutateAsync(selectedItem.id)
    } else {
      await deleteCategory.mutateAsync(selectedItem.id)
    }

    handleCloseModals()
  }

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const itemLabel = activeTab === 'event' ? 'Esdeveniment' : 'Categoria'
  const buttonText = activeTab === 'event' ? 'Nou Esdeveniment' : 'Nova Categoria'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuració</h1>
        <p className="text-gray-600 mt-1">Gestió d'esdeveniments i categories</p>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestió de configuració</CardTitle>
              <CardDescription>
                Crea i gestiona els esdeveniments i categories del sistema
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingType)}>
            <TabsList>
              <TabsTrigger value="event">Esdeveniments</TabsTrigger>
              <TabsTrigger value="category">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="event">
              <SettingsTable
                items={events || []}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onToggleActive={handleToggleActive}
              />
            </TabsContent>

            <TabsContent value="category">
              <SettingsTable
                items={categories || []}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onToggleActive={handleToggleActive}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader onClose={handleCloseModals}>
            <DialogTitle>Crear {itemLabel}</DialogTitle>
            <DialogDescription>
              Afegeix un nou {itemLabel.toLowerCase()} al sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <DialogBody>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">Clau *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="ex: peregrinatge_estiu_roma"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador únic en minúscules, sense espais
                  </p>
                </div>
                <div>
                  <Label htmlFor="label">Etiqueta *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="ex: Peregrinatge d'estiu (Roma)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Nom visible per als usuaris</p>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel·lar
              </Button>
              <Button
                type="submit"
                disabled={createEvent.isPending || createCategory.isPending}
              >
                {(createEvent.isPending || createCategory.isPending) && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader onClose={handleCloseModals}>
            <DialogTitle>Editar {itemLabel}</DialogTitle>
            <DialogDescription>
              Modifica l'etiqueta de l'{itemLabel.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <DialogBody>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-key">Clau</Label>
                  <Input id="edit-key" value={formData.key} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">La clau no es pot modificar</p>
                </div>
                <div>
                  <Label htmlFor="edit-label">Etiqueta *</Label>
                  <Input
                    id="edit-label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel·lar
              </Button>
              <Button type="submit" disabled={updateEvent.isPending || updateCategory.isPending}>
                {(updateEvent.isPending || updateCategory.isPending) && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Actualitzar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader onClose={handleCloseModals}>
            <DialogTitle>Eliminar {itemLabel}</DialogTitle>
            <DialogDescription>
              Estàs segur que vols eliminar aquest {itemLabel.toLowerCase()}?
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Atenció:</strong> Aquesta acció no es pot desfer. Si aquest{' '}
                {itemLabel.toLowerCase()} està en ús, pot afectar les despeses existents.
              </p>
            </div>
            {selectedItem && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Clau:</strong> {selectedItem.key}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Etiqueta:</strong> {selectedItem.label}
                </p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModals}>
              Cancel·lar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEvent.isPending || deleteCategory.isPending}
            >
              {(deleteEvent.isPending || deleteCategory.isPending) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Settings Table Component
interface SettingsTableProps {
  items: SettingItem[]
  onEdit: (item: SettingItem) => void
  onDelete: (item: SettingItem) => void
  onToggleActive: (item: SettingItem) => void
}

function SettingsTable({ items, onEdit, onDelete, onToggleActive }: SettingsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hi ha elements configurats
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etiqueta</TableHead>
            <TableHead>Clau</TableHead>
            <TableHead className="w-[120px]">Estat</TableHead>
            <TableHead className="w-[120px] text-right">Accions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-gray-900">{item.label}</TableCell>
              <TableCell className="font-mono text-sm text-gray-600">{item.key}</TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleActive(item)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.isActive === 'true'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.isActive === 'true' ? 'Actiu' : 'Inactiu'}
                </button>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    title="Eliminar"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
