'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Users,
  Sparkles,
  UserCircle,
  XCircle,
  Clock,
  CheckCircle
} from 'lucide-react'
import type {
  RevenueStats,
  DailyRevenue,
  ServiceStats,
  EmployeeStats,
  CustomerStats,
  PeriodType
} from '@/lib/actions/analytics'

type AnalyticsDashboardProps = {
  revenueStats: RevenueStats | null
  dailyRevenue: DailyRevenue[]
  serviceStats: ServiceStats[]
  employeeStats: EmployeeStats[]
  customerStats: CustomerStats | null
}

export function AnalyticsDashboard({
  revenueStats,
  dailyRevenue,
  serviceStats,
  employeeStats,
  customerStats
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<PeriodType>('month')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1)

  // Calculate completion rate
  const completionRate = revenueStats
    ? (revenueStats.completedCount / Math.max(revenueStats.appointmentCount, 1)) * 100
    : 0

  // Calculate cancellation rate
  const cancellationRate = revenueStats
    ? (revenueStats.canceledCount / Math.max(revenueStats.appointmentCount, 1)) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month', 'year'] as PeriodType[]).map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === 'today' && 'Heute'}
            {p === 'week' && 'Woche'}
            {p === 'month' && 'Monat'}
            {p === 'year' && 'Jahr'}
          </Button>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(revenueStats?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenueStats?.appointmentCount || 0} Termine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueStats?.completed || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenueStats?.completedCount || 0} Termine ({completionRate.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(revenueStats?.pending || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Geplante Termine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storniert</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {revenueStats?.canceledCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cancellationRate.toFixed(1)}% Stornierungsrate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Umsatzverlauf
            </CardTitle>
            <CardDescription>Täglicher Umsatz im Zeitraum</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenue.length > 0 ? (
              <div className="space-y-2">
                {/* Simple bar chart */}
                <div className="flex items-end gap-1 h-40">
                  {dailyRevenue.slice(-14).map((day, i) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                        style={{
                          height: `${(day.revenue / maxRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? '4px' : '0'
                        }}
                        title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                      />
                    </div>
                  ))}
                </div>
                {/* X-axis labels */}
                <div className="flex gap-1 text-xs text-muted-foreground">
                  {dailyRevenue.slice(-14).map((day, i) => (
                    <div key={day.date} className="flex-1 text-center truncate">
                      {i % 2 === 0 ? formatDate(day.date) : ''}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Kunden
            </CardTitle>
            <CardDescription>Kundenstatistiken im Zeitraum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{customerStats?.totalCustomers || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Neu</p>
                <p className="text-2xl font-bold text-green-600">+{customerStats?.newCustomers || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Wiederkehrend</p>
                <p className="text-2xl font-bold text-blue-600">{customerStats?.returningCustomers || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ø Ausgaben</p>
                <p className="text-2xl font-bold">{formatCurrency(customerStats?.averageSpent || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services and Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Beliebteste Services
            </CardTitle>
            <CardDescription>Nach Anzahl der Buchungen</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStats.length > 0 ? (
              <div className="space-y-4">
                {serviceStats.slice(0, 5).map((service, index) => {
                  const maxBookings = serviceStats[0]?.bookingCount || 1
                  const percentage = (service.bookingCount / maxBookings) * 100

                  return (
                    <div key={service.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-5">
                            {index + 1}.
                          </span>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{service.bookingCount}</span>
                          <span className="text-muted-foreground text-sm ml-1">Buchungen</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Umsatz: {formatCurrency(service.revenue)}</span>
                        <span>Ø {formatCurrency(service.averagePrice)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Keine Services gebucht
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Mitarbeiter-Performance
            </CardTitle>
            <CardDescription>Nach Umsatz</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeStats.length > 0 ? (
              <div className="space-y-4">
                {employeeStats.slice(0, 5).map((employee, index) => {
                  const maxRevenue = employeeStats[0]?.revenue || 1
                  const percentage = (employee.revenue / maxRevenue) * 100

                  return (
                    <div key={employee.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-5">
                            {index + 1}.
                          </span>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(employee.revenue)}</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{employee.appointmentCount} Termine</span>
                        <span>{employee.completedCount} abgeschlossen</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Keine Mitarbeiter-Daten
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{completionRate.toFixed(0)}%</p>
              <p className="text-sm text-green-600">Abschlussrate</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-700">{revenueStats?.noShowCount || 0}</p>
              <p className="text-sm text-red-600">No-Shows</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700">{revenueStats?.appointmentCount || 0}</p>
              <p className="text-sm text-blue-600">Termine gesamt</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Euro className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency((revenueStats?.completed || 0) / Math.max(revenueStats?.completedCount || 1, 1))}
              </p>
              <p className="text-sm text-purple-600">Ø pro Termin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
