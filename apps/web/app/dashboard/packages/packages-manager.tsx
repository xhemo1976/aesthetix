'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Package,
  Repeat,
  Trash2,
  Edit,
  Star,
  Users,
  ShoppingCart,
  Percent,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import {
  createPackage,
  updatePackage,
  deletePackage,
  updatePackageItems,
  sellPackageToCustomer,
  redeemPackageUse,
  type Package as PackageType,
} from '@/lib/actions/packages'

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
}

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

type CustomerPackage = {
  id: string
  customer_id: string
  package_id: string
  purchase_price: number
  purchased_at: string
  expires_at: string | null
  total_uses: number
  uses_remaining: number
  status: string
  packages?: {
    id: string
    name: string
    package_type: string
    services?: { name: string } | null
  } | null
  customers?: {
    first_name: string
    last_name: string
  } | null
}

type PackagesManagerProps = {
  initialPackages: PackageType[]
  customerPackages: CustomerPackage[]
  services: Service[]
  customers: Customer[]
}

export function PackagesManager({
  initialPackages,
  customerPackages: initialCustomerPackages,
  services,
  customers,
}: PackagesManagerProps) {
  const [packages, setPackages] = useState(initialPackages)
  const [customerPackages, setCustomerPackages] = useState(initialCustomerPackages)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [selectedPackageForSale, setSelectedPackageForSale] = useState<PackageType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [packageType, setPackageType] = useState<'bundle' | 'multiuse'>('bundle')
  const [serviceId, setServiceId] = useState('')
  const [totalUses, setTotalUses] = useState('10')
  const [originalPrice, setOriginalPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [validityDays, setValidityDays] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [maxPerCustomer, setMaxPerCustomer] = useState('1')
  const [bundleItems, setBundleItems] = useState<{ serviceId: string; quantity: number }[]>([])

  // Sell form state
  const [sellCustomerId, setSellCustomerId] = useState('')
  const [sellNotes, setSellNotes] = useState('')

  function resetForm() {
    setName('')
    setDescription('')
    setPackageType('bundle')
    setServiceId('')
    setTotalUses('10')
    setOriginalPrice('')
    setSalePrice('')
    setValidityDays('')
    setValidFrom('')
    setValidUntil('')
    setIsActive(true)
    setIsFeatured(false)
    setMaxPerCustomer('1')
    setBundleItems([])
    setEditingPackage(null)
  }

  function openEditDialog(pkg: PackageType) {
    setEditingPackage(pkg)
    setName(pkg.name)
    setDescription(pkg.description || '')
    setPackageType(pkg.package_type)
    setServiceId(pkg.service_id || '')
    setTotalUses(pkg.total_uses.toString())
    setOriginalPrice(pkg.original_price.toString())
    setSalePrice(pkg.sale_price.toString())
    setValidityDays(pkg.validity_days?.toString() || '')
    setValidFrom(pkg.valid_from?.split('T')[0] || '')
    setValidUntil(pkg.valid_until?.split('T')[0] || '')
    setIsActive(pkg.is_active)
    setIsFeatured(pkg.is_featured)
    setMaxPerCustomer(pkg.max_per_customer.toString())
    setBundleItems(
      (pkg.package_items || []).map(item => ({
        serviceId: item.service_id,
        quantity: item.quantity,
      }))
    )
    setDialogOpen(true)
  }

  function addBundleItem() {
    setBundleItems([...bundleItems, { serviceId: '', quantity: 1 }])
  }

  function removeBundleItem(index: number) {
    setBundleItems(bundleItems.filter((_, i) => i !== index))
  }

  function updateBundleItem(index: number, field: 'serviceId' | 'quantity', value: string | number) {
    const updated = [...bundleItems]
    updated[index] = { ...updated[index], [field]: value }
    setBundleItems(updated)
  }

  function calculateOriginalPrice() {
    if (packageType === 'bundle') {
      const total = bundleItems.reduce((sum, item) => {
        const service = services.find(s => s.id === item.serviceId)
        return sum + (service ? service.price * item.quantity : 0)
      }, 0)
      setOriginalPrice(total.toString())
    } else if (packageType === 'multiuse' && serviceId) {
      const service = services.find(s => s.id === serviceId)
      if (service) {
        setOriginalPrice((service.price * parseInt(totalUses || '1')).toString())
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('description', description)
    formData.set('package_type', packageType)
    formData.set('service_id', serviceId)
    formData.set('total_uses', totalUses)
    formData.set('original_price', originalPrice)
    formData.set('sale_price', salePrice)
    formData.set('validity_days', validityDays)
    formData.set('valid_from', validFrom)
    formData.set('valid_until', validUntil)
    formData.set('is_active', isActive.toString())
    formData.set('is_featured', isFeatured.toString())
    formData.set('max_per_customer', maxPerCustomer)

    let result
    if (editingPackage) {
      result = await updatePackage(editingPackage.id, formData)
      if (!result.error && packageType === 'bundle') {
        await updatePackageItems(editingPackage.id, bundleItems)
      }
    } else {
      result = await createPackage(formData)
      if (!result.error && result.packageId && packageType === 'bundle') {
        await updatePackageItems(result.packageId, bundleItems)
      }
    }

    if (!result.error) {
      setDialogOpen(false)
      resetForm()
      window.location.reload()
    } else {
      alert(result.error)
    }

    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchtest du dieses Paket wirklich löschen?')) return

    const result = await deletePackage(id)
    if (!result.error) {
      setPackages(packages.filter(p => p.id !== id))
    }
  }

  async function handleSell(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPackageForSale) return

    setIsLoading(true)

    const formData = new FormData()
    formData.set('package_id', selectedPackageForSale.id)
    formData.set('customer_id', sellCustomerId)
    formData.set('notes', sellNotes)

    const result = await sellPackageToCustomer(formData)

    if (!result.error) {
      setSellDialogOpen(false)
      setSellCustomerId('')
      setSellNotes('')
      setSelectedPackageForSale(null)
      window.location.reload()
    } else {
      alert(result.error)
    }

    setIsLoading(false)
  }

  async function handleRedeem(customerPackageId: string) {
    if (!confirm('Möchtest du eine Verwendung von diesem Paket einlösen?')) return

    const result = await redeemPackageUse(customerPackageId)
    if (!result.error) {
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const discountPercent = originalPrice && salePrice
    ? Math.round(((parseFloat(originalPrice) - parseFloat(salePrice)) / parseFloat(originalPrice)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packages.length}</p>
                <p className="text-sm text-muted-foreground">Pakete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customerPackages.length}</p>
                <p className="text-sm text-muted-foreground">Verkauft</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Repeat className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {customerPackages.filter(cp => cp.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Aktive Kundenpakete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="packages" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="packages">Pakete</TabsTrigger>
            <TabsTrigger value="sold">Verkaufte Pakete</TabsTrigger>
          </TabsList>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Neues Paket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? 'Paket bearbeiten' : 'Neues Paket erstellen'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="z.B. 10er Karte Massage"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Beschreibung des Pakets..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Package Type */}
                <div>
                  <Label>Pakettyp *</Label>
                  <Select value={packageType} onValueChange={(v: 'bundle' | 'multiuse') => setPackageType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiuse">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          Mehrfachkarte (z.B. 10x Massage)
                        </div>
                      </SelectItem>
                      <SelectItem value="bundle">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Paket (mehrere Services)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Multiuse: Service Selection */}
                {packageType === 'multiuse' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service *</Label>
                      <Select value={serviceId} onValueChange={setServiceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Service auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({formatPrice(service.price)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="totalUses">Anzahl Verwendungen *</Label>
                      <Input
                        id="totalUses"
                        type="number"
                        min="1"
                        value={totalUses}
                        onChange={e => setTotalUses(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Bundle: Service Items */}
                {packageType === 'bundle' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Enthaltene Services</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
                        <Plus className="w-3 h-3 mr-1" />
                        Hinzufügen
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {bundleItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Select
                            value={item.serviceId}
                            onValueChange={v => updateBundleItem(index, 'serviceId', v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Service..." />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} ({formatPrice(service.price)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateBundleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBundleItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {bundleItems.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Füge Services zum Paket hinzu
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="originalPrice">Normalpreis *</Label>
                    <div className="relative">
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={originalPrice}
                        onChange={e => setOriginalPrice(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 text-xs"
                        onClick={calculateOriginalPrice}
                      >
                        Berechnen
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salePrice">Paketpreis *</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={e => setSalePrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label>Rabatt</Label>
                    <div className="h-10 flex items-center">
                      <Badge variant={discountPercent > 0 ? 'default' : 'secondary'}>
                        <Percent className="w-3 h-3 mr-1" />
                        {discountPercent}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="validityDays">Gültigkeit (Tage)</Label>
                    <Input
                      id="validityDays"
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={e => setValidityDays(e.target.value)}
                      placeholder="z.B. 365"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validFrom">Verkauf ab</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={validFrom}
                      onChange={e => setValidFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Verkauf bis</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxPerCustomer">Max. pro Kunde</Label>
                    <Input
                      id="maxPerCustomer"
                      type="number"
                      min="1"
                      value={maxPerCustomer}
                      onChange={e => setMaxPerCustomer(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked === true)}
                      />
                      <Label htmlFor="isActive">Aktiv</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={isFeatured}
                        onCheckedChange={(checked) => setIsFeatured(checked === true)}
                      />
                      <Label htmlFor="isFeatured">Hervorgehoben</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Speichert...' : editingPackage ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Packages List */}
        <TabsContent value="packages">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Noch keine Pakete erstellt
                </CardContent>
              </Card>
            ) : (
              packages.map(pkg => {
                const service = Array.isArray(pkg.services) ? pkg.services[0] : pkg.services

                return (
                  <Card key={pkg.id} className={!pkg.is_active ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {pkg.package_type === 'multiuse' ? (
                              <Repeat className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                            {pkg.name}
                          </CardTitle>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {pkg.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {pkg.is_featured && (
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {!pkg.is_active && <Badge variant="outline">Inaktiv</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Package details */}
                        {pkg.package_type === 'multiuse' && service && (
                          <p className="text-sm">
                            {pkg.total_uses}x {service.name}
                          </p>
                        )}
                        {pkg.package_type === 'bundle' && pkg.package_items && (
                          <div className="text-sm space-y-1">
                            {pkg.package_items.map(item => {
                              const itemService = Array.isArray(item.services) ? item.services[0] : item.services
                              return (
                                <p key={item.id}>
                                  {item.quantity}x {itemService?.name}
                                </p>
                              )
                            })}
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(pkg.sale_price)}
                          </span>
                          {pkg.original_price > pkg.sale_price && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(pkg.original_price)}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                -{pkg.discount_percentage}%
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Validity */}
                        {pkg.validity_days && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Gültig für {pkg.validity_days} Tage
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedPackageForSale(pkg)
                              setSellDialogOpen(true)
                            }}
                            disabled={!pkg.is_active}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Verkaufen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(pkg)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pkg.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Sold Packages */}
        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Verkaufte Pakete
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerPackages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Pakete verkauft
                </p>
              ) : (
                <div className="space-y-3">
                  {customerPackages.map(cp => {
                    const pkg = Array.isArray(cp.packages) ? cp.packages[0] : cp.packages
                    const customer = Array.isArray(cp.customers) ? cp.customers[0] : cp.customers

                    return (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {customer?.first_name} {customer?.last_name}
                            </span>
                            <Badge
                              variant={cp.status === 'active' ? 'default' : 'secondary'}
                            >
                              {cp.status === 'active' ? 'Aktiv' :
                                cp.status === 'fully_used' ? 'Aufgebraucht' :
                                  cp.status === 'expired' ? 'Abgelaufen' : cp.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pkg?.name} | {formatPrice(cp.purchase_price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gekauft: {formatDate(cp.purchased_at)}
                            {cp.expires_at && ` | Läuft ab: ${formatDate(cp.expires_at)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{cp.uses_remaining}</p>
                            <p className="text-xs text-muted-foreground">von {cp.total_uses}</p>
                          </div>
                          {cp.status === 'active' && cp.uses_remaining > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRedeem(cp.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Einlösen
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paket verkaufen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSell} className="space-y-4">
            {selectedPackageForSale && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedPackageForSale.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(selectedPackageForSale.sale_price)}
                </p>
              </div>
            )}

            <div>
              <Label>Kunde *</Label>
              <Select value={sellCustomerId} onValueChange={setSellCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sellNotes">Notizen</Label>
              <Textarea
                id="sellNotes"
                value={sellNotes}
                onChange={e => setSellNotes(e.target.value)}
                placeholder="Optional..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setSellDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || !sellCustomerId}>
                {isLoading ? 'Wird verkauft...' : 'Verkaufen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
