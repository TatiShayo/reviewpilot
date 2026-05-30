'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
})

const responseDefaultsSchema = z.object({
  defaultTone: z.enum(['professional', 'friendly', 'brief']),
  globalSignature: z.string().max(200).optional(),
  maxResponseLength: z.enum(['short', 'medium', 'long']),
})

const notificationsSchema = z.object({
  emailDigest: z.enum(['daily', 'weekly', 'never']),
  alertOneStar: z.boolean(),
})

const TONES = [
  { value: 'professional', label: 'Professional', description: 'Formal, courteous, business-appropriate' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, personal, conversational' },
  { value: 'brief', label: 'Brief', description: 'Short, direct, to the point' },
]

const LENGTHS = [
  { value: 'short', label: 'Short', description: '1–2 sentences' },
  { value: 'medium', label: 'Medium', description: '3–5 sentences' },
  { value: 'long', label: 'Long', description: 'Full paragraph' },
]

const DIGEST_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
]

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', companyName: '' },
  })

  const defaultsForm = useForm({
    resolver: zodResolver(responseDefaultsSchema),
    defaultValues: {
      defaultTone: 'professional' as const,
      globalSignature: '',
      maxResponseLength: 'medium' as const,
    },
  })

  const notificationsForm = useForm({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailDigest: 'weekly' as const,
      alertOneStar: false,
    },
  })

  const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue } = profileForm
  const { register: registerDefaults, handleSubmit: handleDefaultsSubmit, setValue: setDefaultsValue, watch: watchDefaults } = defaultsForm
  const { register: registerNotifications, handleSubmit: handleNotificationsSubmit, setValue: setNotificationsValue, watch: watchNotifications } = notificationsForm

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUserEmail(user.email || '')

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, company_name, default_tone, global_signature, max_response_length, email_digest, alert_one_star')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (profile) {
          // Profile tab
          setProfileValue('fullName', profile.full_name || '')
          setProfileValue('companyName', profile.company_name || '')

          // Response Defaults tab
          setDefaultsValue('defaultTone', (profile.default_tone || 'professional') as 'professional' | 'friendly' | 'brief')
          setDefaultsValue('globalSignature', profile.global_signature || '')
          setDefaultsValue('maxResponseLength', (profile.max_response_length || 'medium') as 'short' | 'medium' | 'long')

          // Notifications tab
          setNotificationsValue('emailDigest', (profile.email_digest || 'weekly') as 'daily' | 'weekly' | 'never')
          setNotificationsValue('alertOneStar', profile.alert_one_star ?? false)
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function onSaveProfile(data: { fullName: string; companyName?: string }) {
    setSavingProfile(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          company_name: data.companyName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function onSaveDefaults(data: { defaultTone: string; globalSignature?: string; maxResponseLength: string }) {
    setSavingDefaults(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          default_tone: data.defaultTone,
          global_signature: data.globalSignature || null,
          max_response_length: data.maxResponseLength,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Response defaults saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save defaults')
    } finally {
      setSavingDefaults(false)
    }
  }

  async function onSaveNotifications(data: { emailDigest: string; alertOneStar: boolean }) {
    setSavingNotifications(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          email_digest: data.emailDigest,
          alert_one_star: data.alertOneStar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Notification preferences saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notifications')
    } finally {
      setSavingNotifications(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="defaults">Response Defaults</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleProfileSubmit(onSaveProfile)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Name</Label>
                  <Input id="fullName" {...registerProfile('fullName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userEmail}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed via your account settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your company or organization"
                    {...registerProfile('companyName')}
                  />
                </div>

                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle>Response Defaults</CardTitle>
              <CardDescription>
                Default settings used when generating AI responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleDefaultsSubmit(onSaveDefaults)}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label>Default response tone</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {TONES.map((tone) => (
                      <label
                        key={tone.value}
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${
                          watchDefaults('defaultTone') === tone.value
                            ? 'border-[#f97316] bg-[#f97316]/10'
                            : 'hover:border-muted-foreground/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={tone.value}
                            {...registerDefaults('defaultTone')}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{tone.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tone.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Global signature</Label>
                  <Textarea
                    id="signature"
                    placeholder='e.g. — The [Company] Team'
                    className="max-h-20"
                    {...registerDefaults('globalSignature')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Appended to every AI-generated response. Max 200 characters.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Max response length</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {LENGTHS.map((len) => (
                      <label
                        key={len.value}
                        className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${
                          watchDefaults('maxResponseLength') === len.value
                            ? 'border-[#f97316] bg-[#f97316]/10'
                            : 'hover:border-muted-foreground/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={len.value}
                            {...registerDefaults('maxResponseLength')}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{len.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {len.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={savingDefaults}>
                  {savingDefaults ? 'Saving...' : 'Save Defaults'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how and when you receive email updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleNotificationsSubmit(onSaveNotifications)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="emailDigest">Email digest</Label>
                  <Select
                    value={watchNotifications('emailDigest')}
                    onValueChange={(value) =>
                      setNotificationsValue('emailDigest', value as 'daily' | 'weekly' | 'never')
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGEST_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Receive a summary of your review activity on this schedule.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>1-star review alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Get an immediate email when you receive a 1-star review.
                    </p>
                  </div>
                  <Switch
                    checked={watchNotifications('alertOneStar')}
                    onCheckedChange={(checked) =>
                      setNotificationsValue('alertOneStar', checked)
                    }
                  />
                </div>

                <Button type="submit" disabled={savingNotifications}>
                  {savingNotifications ? 'Saving...' : 'Save Notifications'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
