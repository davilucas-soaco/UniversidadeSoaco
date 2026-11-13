import { ProfileAccountCard } from '@/components/profile/ProfileAccountCard'
import { ProfileCoursesCard } from '@/components/profile/ProfileCoursesCard'
import { ProfileHero } from '@/components/profile/ProfileHero'

export function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 pb-12">
      <div data-tour="profile-hero">
        <ProfileHero />
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div data-tour="profile-courses" className="xl:col-span-7">
          <ProfileCoursesCard />
        </div>
        <div data-tour="profile-account" className="xl:col-span-5">
          <ProfileAccountCard />
        </div>
      </div>
    </div>
  )
}
