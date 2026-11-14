import { ContactSection } from '@/components/home/ContactSection';

export const metadata = {
  title: 'Contact Us | PlaySphere AI',
  description: 'Reach out to the PlaySphere AI team for help, password assistance, venue onboarding, and support.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-14 bg-background">
      <ContactSection />
    </div>
  );
}

