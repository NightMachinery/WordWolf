import Image from 'next/image';

import {
  RoleContainer,
  InnerRoleContainer,
  UserRolePhotoContainer,
  Img,
  Banner,
} from './ModalStyles/UserRoleCard';

function UserRole({ roles }) {
  return (
    roles
      ? (
        <RoleContainer>
          <InnerRoleContainer>
            {roles === 'seer'
              ? (
                <UserRolePhotoContainer>
                  <Img>
                    <Image src="/seer.jpeg" width={160} height={160} />
                  </Img>
                  <Banner>SEER</Banner>
                </UserRolePhotoContainer>
              ) : null}
            {roles === 'villager'
              ? (
                <UserRolePhotoContainer>
                  <Img>
                    <Image src="/villager.jpeg" width={160} height={160} />
                  </Img>
                  <Banner>VILLAGER</Banner>
                </UserRolePhotoContainer>
              ) : null}
            {roles === 'werewolf'
              ? (
                <UserRolePhotoContainer>
                  <Img>
                    <Image src="/wolf.jpeg" width={160} height={160} />
                  </Img>
                  <Banner>WOLF</Banner>
                </UserRolePhotoContainer>
              ) : null}
          </InnerRoleContainer>
        </RoleContainer>
      ) : null
  );
}

export default UserRole;
