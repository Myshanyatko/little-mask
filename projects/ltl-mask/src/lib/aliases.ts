export const enum Aliases {
  'number' = '0',
  'alphanumeric' = '&',
  'alphabetical' = 'a',
  'all' = '?',
}

export const AliasesDict: { [alias: string]: string } = {
  [Aliases.number]: '\\d',
  [Aliases.alphanumeric]: '\\w',
  [Aliases.alphabetical]: '[A-Za-zА-Яа-я]',
  [Aliases.all]: '.',
};
