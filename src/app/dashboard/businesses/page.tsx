'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { getMockBusinesses } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, MapPin } from 'lucide-react'

const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  gmbId: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
})

type BusinessFormData = z.infer<typeof businessSchema>

interface Business {
  id: string
  name: string
  gmbId?: string
  category?: string
  address?: string
  phone?: string
  website?: string
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>(() =>
    getMockBusinesses().map((b) => ({
      id: b.id,
      name: b.name,
    }))
  )
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  })

  function openAdd() {
    setEditingBusiness(null)
    reset({ name: '', gmbId: '', category: '', address: '', phone: '', website: '' })
    setDialogOpen(true)
  }

  function openEdit(business: Business) {
    setEditingBusiness(business)
    reset({
      name: business.name,
      gmbId: business.gmbId || '',
      category: business.category || '',
      address: business.address || '',
      phone: business.phone || '',
      website: business.website || '',
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: BusinessFormData) {
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        if (editingBusiness) {
          const { error } = await supabase
            .from('businesses')
            .update(data)
            .eq('id', editingBusiness.id)

          if (error) throw error

          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === editingBusiness.id ? { ...b, ...data } : b
            )
          )
          toast.success('Business updated')
        } else {
          const { data: created, error } = await supabase
            .from('businesses')
            .insert({ ...data, user_id: user.id })
            .select()
            .single()

          if (error) throw error

          setBusinesses((prev) => [...prev, created as Business])
          toast.success('Business added')
        }
      } else {
        // Mock mode
        if (editingBusiness) {
          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === editingBusiness.id ? { ...b, ...data } : b
            )
          )
          toast.success('Business updated (mock)')
        } else {
          const newBusiness: Business = {
            id: `b${Date.now()}`,
            ...data,
          }
          setBusinesses((prev) => [...prev, newBusiness])
          toast.success('Business added (mock)')
        }
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save business')
    } finally {
      setSaving(false)
    }
  }

  const CATEGORIES = [
    'Restaurant',
    'Cafe',
    'Retail',
    'Healthcare',
    'Dental',
    'Salon & Spa',
    'Auto Repair',
    'Real Estate',
    'Legal Services',
    'Other',
  ]

  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Businesses</h2>
            <p className="mt-1 text-muted-foreground">Manage your Google My Business locations.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Business
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBusiness ? 'Edit Business' : 'Add Business'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input id="name" placeholder="Sunset Cafe & Bakery" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gmbId">Google My Business ID</Label>
                  <Input id="gmbId" placeholder="accounts/123/locations/456" {...register('gmbId')} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <Select onValueChange={(v) => setValue('category', v as string)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="123 Main St, City, State" {...register('address')} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="(555) 123-4567" {...register('phone')} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://example.com" {...register('website')} />
                </div>
                <Button type="submit" disabled={saving} className="w-full mt-2">
                  {saving ? 'Saving...' : editingBusiness ? 'Update Business' : 'Add Business'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {businesses.length === 0 ? (
          <div className="mt-16 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No businesses yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first business to start managing reviews.</p>
            <Button onClick={openAdd} className="mt-4">
              <Plus className="h-4 w-4" />
              Add Business
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div key={business.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{business.name}</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(business)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {business.address && (
                  <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {business.address}
                  </p>
                )}
                {business.category && (
                  <span className="mt-2 inline-block text-xs bg-muted px-2 py-0.5 rounded-full">
                    {business.category}
                  </span>
                )}
                {business.gmbId && (
                  <p className="mt-2 text-xs text-muted-foreground">GMB: {business.gmbId}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
