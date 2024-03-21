import { useAccount, useAccountDeriveBalancesAll, useApi, useBalanceFormat } from '@gear-js/react-hooks';
import { Button } from '@gear-js/vara-ui';
import { Players } from 'types';
import { useReadGameSessionState, useSyndoteMessage } from 'hooks/metadata';
import { ReactComponent as VaraSVG } from 'assets/images/icons/vara-coin.svg';
import { ReactComponent as TVaraSVG } from 'assets/images/icons/tvara-coin.svg';
import { ReactComponent as UserSVG } from 'assets/images/icons/ic-user-small-24.svg';
import { ReactComponent as CopySVG } from 'assets/images/icons/copy-text.svg';
import { ReactComponent as RemovePlayerSVG } from 'assets/images/icons/remove-player.svg';
import styles from './SessionInfo.module.scss';
import { stringShorten } from '@polkadot/util';
import { GameDetails } from 'components/layout/game-details';
import clsx from 'clsx';
import { HexString } from '@gear-js/api';

type Props = {
  entryFee: string | null;
  players: Players;
  adminId: string;
};

function SessionInfo({ entryFee, players, adminId }: Props) {
  const { isApiReady } = useApi();
  const { account } = useAccount();
  const { state } = useReadGameSessionState();
  const { isMeta, sendMessage } = useSyndoteMessage();
  const { getFormattedBalance } = useBalanceFormat();
  const balances = useAccountDeriveBalancesAll();
  const balance =
    isApiReady && balances?.freeBalance ? getFormattedBalance(balances.freeBalance.toString()) : undefined;
  const VaraSvg = balance?.unit?.toLowerCase() === 'vara' ? <VaraSVG /> : <TVaraSVG />;
  const items = [
    {
      name: 'Entry fee',
      value: (
        <>
          {VaraSvg} {entryFee || 0} VARA
        </>
      ),
    },
    {
      name: 'Players already joined the game',
      value: (
        <>
          <UserSVG /> {players.length} / 4
        </>
      ),
    },
    {
      name: `Program address (${stringShorten(
        players.find((item) => item[1].ownerId === account?.decodedAddress)?.[0] || '',
        4,
      )})`,
      value: <Button color="transparent" icon={CopySVG} text="Copy" className={styles.copyButton} />,
    },
  ];
  const isAdmin = adminId === account?.decodedAddress;

  const removePlayer = (playerId: HexString) => {
    if (!isMeta) {
      return;
    }

    const payload = {
      DeletePlayer: {
        playerId,
      },
    };

    sendMessage({
      payload,
    });
  };
  console.log(players);
  return (
    <>
      <GameDetails items={items} className={{ item: styles.gameDetailsItem }} />
      <ul className={styles.playersContainer}>
        {players.map((player) => (
          <li
            key={player[1].ownerId}
            className={clsx(
              styles.playerItem,
              player[1].ownerId === account?.decodedAddress && styles.playerItemAdmin,
              isAdmin && player[1].ownerId !== account?.decodedAddress && styles.playerItemForAdmin,
            )}>
            <span>
              {stringShorten(player[1].ownerId, 4)}{' '}
              {player[1].ownerId === account?.decodedAddress ? <span className={styles.playerLabel}>(you)</span> : ''}
            </span>
            {isAdmin && player[1].ownerId !== account?.decodedAddress && (
              <Button color="transparent" icon={RemovePlayerSVG} onClick={() => removePlayer(player[1].ownerId)} />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export { SessionInfo };