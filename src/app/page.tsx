
import { use } from 'react'; // Ensure 'use' is imported
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SkillsSection from '@/components/sections/SkillsSection';
import TimelineSection from '@/components/sections/TimelineSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ResumeSection from '@/components/sections/ResumeSection';
import ContactSection from '@/components/sections/ContactSection';

export const dynamic = "force-dynamic"; // Ensures the page is dynamically rendered

// Define the expected props for the HomePage component
interface HomePageProps {
  params: { [key: string]: string | string[] | undefined };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function HomePage({ params, searchParams }: HomePageProps) {
  // Unwrap both params and searchParams using React.use()
  // This is a defensive measure. Even if not directly used in this component's JSX,
  // it makes them "safe" if Next.js internals or nested server components
  // try to enumerate their keys before they are fully resolved.
  const resolvedParams = params ? use(params) : {};
  const resolvedSearchParams = searchParams ? use(searchParams) : {};

  // For debugging, you can log the resolved params:
  // console.log("Resolved Page Params on server:", resolvedParams);
  // console.log("Resolved Search Params on server:", resolvedSearchParams);

  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <TimelineSection />
      <CertificationsSection />
      <ResumeSection />
      <ContactSection />
    </>
  );
}
