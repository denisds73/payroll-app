import Avatar from '../components/ui/Avatar';

export default function TestPage() {
  return (
    <div className="flex gap-4 items-center">
      {/* Name only: should show initials */}
      <Avatar name="Flavio Denis" />

      {/* Photo URL present: should show image */}
      <Avatar name="Jane Doe" src="https://randomuser.me/api/portraits/women/68.jpg" />

      {/* Larger avatar (test sizing) */}
      <Avatar name="John Smith" size={64} />

      {/* Photo with broken URL: should fallback to initials */}
      <Avatar name="Alex Broken" src="broken/notfound.jpg" />

      {/* Short name: edge case */}
      <Avatar name="A" />

      {/* Non-Latin/alphabet name: does it show something sensible? */}
      <Avatar name="山田 太郎" />

      {/* Custom className */}
      <Avatar name="Custom" className="ring-2 ring-green-300" />
    </div>
  );
}
