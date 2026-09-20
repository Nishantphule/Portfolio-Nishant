import { experience, profile, skills } from '../data/profile';
import { dateRangeToIso } from '../lib/jobDates';

export default function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    email: profile.email,
    telephone: `+91${profile.phone}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nashik',
      addressCountry: 'IN',
    },
    url: profile.linkedin,
    sameAs: [profile.linkedin, profile.github],
    description: profile.about[0],
    knowsAbout: skills.map((s) => s.name),
    alumniOf: [
      { '@type': 'EducationalOrganization', name: 'Airtribe' },
      { '@type': 'EducationalOrganization', name: 'Guvi, IITM Research Park, Chennai' },
      { '@type': 'CollegeOrUniversity', name: 'GES College of Engineering, Nashik' },
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Four Pillars Infotech India Pvt. Ltd.',
    },
    hasOccupation: experience.map((job) => {
      const range = dateRangeToIso(job.dates);
      return {
        '@type': 'Occupation',
        name: job.title,
        occupationLocation: { '@type': 'City', name: job.location },
        description: job.bullets.join(' '),
        startDate: range.start,
        endDate: range.end,
        worksFor: { '@type': 'Organization', name: job.company },
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
