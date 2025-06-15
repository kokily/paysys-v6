import useUserStore from '../../libs/stores/user';

export default function ListMemberPage() {
  const user = useUserStore((state) => state.user);

  console.log(user);

  return <div>ListMemberPage</div>;
}
