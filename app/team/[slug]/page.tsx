import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/actions/public-booking'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sparkles, Calendar, ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatWidget } from '@/components/chat-widget'

type TeamMember = {
  id: string
  first_name: string
  last_name: string
  role: string
  profile_image_url: string | null
  bio: string | null
  specialties: string[]
}

async function getTeamMembers(tenantId: string): Promise<TeamMember[]> {
  const adminClient = createAdminClient()

  const { data: employees } = await adminClient
    .from('employees')
    .select('id, first_name, last_name, role, profile_image_url, bio, specialties')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('first_name', { ascending: true }) as { data: TeamMember[] | null }

  return employees || []
}

const ROLE_LABELS: Record<string, string> = {
  stylist: 'Kosmetiker/in',
  receptionist: 'Rezeption',
  manager: 'Manager',
  other: 'Mitarbeiter/in',
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { tenant, error: tenantError } = await getTenantBySlug(slug)

  if (tenantError || !tenant) {
    notFound()
  }

  const teamMembers = await getTeamMembers(tenant.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <Link href={`/book/${slug}`} className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Buchung
            </Button>
          </Link>

          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-16 mx-auto mb-4 rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-xl text-muted-foreground mt-2">Unser Team</p>
        </header>

        {/* Team Grid */}
        {teamMembers.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Noch keine Teammitglieder hinzugefügt.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Profile Image */}
                <div className="aspect-square relative bg-muted">
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-24 h-24 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-primary font-medium">
                    {ROLE_LABELS[member.role] || member.role}
                  </p>

                  {member.bio && (
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Book Button */}
                  <Link href={`/book/${slug}`} className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Termin buchen
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Powered by Esylana</p>
        </footer>
      </div>

      {/* Chat Widget */}
      <ChatWidget tenantSlug={slug} tenantName={tenant.name} />
    </div>
  )
}
