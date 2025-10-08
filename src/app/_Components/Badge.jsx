const Badge = ({ status }) => {
  const statusStyles = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-red-100 text-red-700',
    Onboarding: 'bg-orange-100 text-orange-700'
  }

  return (
    <span className={`px-2 py-1 text-sm rounded ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

export default Badge;
