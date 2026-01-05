'use client'

import { useState } from 'react'
import { Plus, Trash2, RefreshCw, Power, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  addSocialAccount,
  deleteSocialAccount,
  updateSocialAccount,
  type SocialAccount,
  type SocialPlatform
} from '@/lib/actions/social-media'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'from-yellow-400 via-red-500 to-purple-600' },
  { value: 'facebook', label: 'Facebook', icon: '👤', color: 'from-blue-600 to-blue-700' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-black to-gray-800' },
  { value: 'google', label: 'Google Business', icon: '⭐', color: 'from-red-500 to-yellow-500' },
  { value: 'youtube', label: 'YouTube', icon: '▶️', color: 'from-red-600 to-red-700' }
]

interface SocialAccountsManagerProps {
  initialAccounts: SocialAccount[]
}

export function SocialAccountsManager({ initialAccounts }: SocialAccountsManagerProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state for adding account
  const [formData, setFormData] = useState({
    platform: '' as SocialPlatform,
    username: '',
    profileUrl: '',
    accessToken: ''
  })

  const handleAddAccount = async () => {
    if (!formData.platform || !formData.username) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle alle Pflichtfelder aus',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    const result = await addSocialAccount(
      formData.platform,
      formData.username,
      formData.profileUrl,
      formData.accessToken
    )

    setIsLoading(false)

    if (result.success && result.data) {
      setAccounts([...accounts, result.data])
      setIsAddDialogOpen(false)
      setFormData({ platform: '' as SocialPlatform, username: '', profileUrl: '', accessToken: '' })
      toast({
        title: 'Erfolg',
        description: 'Account wurde hinzugefügt'
      })
    } else {
      toast({
        title: 'Fehler',
        description: result.error || 'Account konnte nicht hinzugefügt werden',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Möchtest du diesen Account wirklich löschen?')) return

    const result = await deleteSocialAccount(accountId)

    if (result.success) {
      setAccounts(accounts.filter(a => a.id !== accountId))
      toast({
        title: 'Erfolg',
        description: 'Account wurde gelöscht'
      })
    } else {
      toast({
        title: 'Fehler',
        description: result.error || 'Account konnte nicht gelöscht werden',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (account: SocialAccount) => {
    const result = await updateSocialAccount(account.id, {
      is_active: !account.is_active
    })

    if (result.success && result.data) {
      setAccounts(accounts.map(a => (a.id === account.id ? result.data! : a)))
      toast({
        title: 'Erfolg',
        description: `Account wurde ${result.data.is_active ? 'aktiviert' : 'deaktiviert'}`
      })
    } else {
      toast({
        title: 'Fehler',
        description: result.error || 'Status konnte nicht geändert werden',
        variant: 'destructive'
      })
    }
  }

  const handleSyncAccount = async (accountId: string) => {
    setSyncingId(accountId)

    try {
      const response = await fetch('/api/social-media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, force: true })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Erfolg',
          description: `${result.posts_synced} Posts synchronisiert`
        })

        // Update last_sync_at
        const updatedAccount = accounts.find(a => a.id === accountId)
        if (updatedAccount) {
          setAccounts(
            accounts.map(a =>
              a.id === accountId ? { ...a, last_sync_at: result.last_sync_at } : a
            )
          )
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Synchronisation fehlgeschlagen',
        variant: 'destructive'
      })
    } finally {
      setSyncingId(null)
    }
  }

  const getPlatformInfo = (platform: string) => {
    return PLATFORMS.find(p => p.value === platform) || PLATFORMS[0]
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Verbundene Accounts</CardTitle>
          <CardDescription>Verwalte deine Social Media Verbindungen</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Account hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Social Media Account hinzufügen</DialogTitle>
              <DialogDescription>
                Verbinde einen neuen Social Media Account mit deinem Dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Plattform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={value => setFormData({ ...formData, platform: value as SocialPlatform })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Plattform wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(platform => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername *</Label>
                <Input
                  id="username"
                  placeholder="@deinaccount"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileUrl">Profil-URL</Label>
                <Input
                  id="profileUrl"
                  placeholder="https://..."
                  value={formData.profileUrl}
                  onChange={e => setFormData({ ...formData, profileUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token (optional)</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Für automatische Synchronisation"
                  value={formData.accessToken}
                  onChange={e => setFormData({ ...formData, accessToken: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Für automatischen Abruf von Posts benötigt
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddAccount} disabled={isLoading}>
                {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Noch keine Accounts verbunden</p>
            <p className="text-sm mt-2">Füge deinen ersten Social Media Account hinzu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map(account => {
              const platformInfo = getPlatformInfo(account.platform)
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${platformInfo.color} flex items-center justify-center text-2xl`}
                    >
                      {platformInfo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{account.username || platformInfo.label}</h4>
                        {!account.is_active && (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{platformInfo.label}</p>
                      {account.last_sync_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Zuletzt sync: {new Date(account.last_sync_at).toLocaleString('de-DE')}
                        </p>
                      )}
                      {account.sync_error && (
                        <p className="text-xs text-destructive mt-1">Fehler: {account.sync_error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.profile_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSyncAccount(account.id)}
                      disabled={syncingId === account.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncingId === account.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(account)}
                    >
                      <Power className={`h-4 w-4 ${account.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
