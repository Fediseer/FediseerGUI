interface Person {
  name: string;
}

interface PersonView {
  person: Person;
}

interface LocalUserView {
  person: Person;
}

interface MyUserInfo {
  local_user_view: LocalUserView;
}

export interface GetSiteResponse {
  admins: PersonView[];
  my_user: MyUserInfo;
}
