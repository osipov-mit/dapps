import { Button, Input, Modal, ModalProps } from '@gear-js/vara-ui';
import { useApi, useBalanceFormat } from '@gear-js/react-hooks';
import { GearKeyring, decodeAddress } from '@gear-js/api';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSignlessTransactions } from '../../context';
import { getMilliseconds } from '../../utils';
import { EnableSessionModal } from '../enable-session-modal';
import styles from './create-session-modal.module.css';
import { SignlessParams } from '../signless-params-list';
import { AccountPair } from '../account-pair';

type Props = Pick<ModalProps, 'close'>;

const DEFAULT_VALUES = { password: '' };
const REQUIRED_MESSAGE = 'Field is required';

const DURATION_MINUTES = 5;
const BALANCE_VALUE_TO_START_GAME = 20;
const BALANCE_VALUE_TO_ISSUE_VOUCHER = 5;
const ACTIONS = ['StartGame', 'Turn'];

function CreateSessionModal({ close }: Props) {
  const { api } = useApi();
  const { getChainBalanceValue, getFormattedBalance } = useBalanceFormat();

  const { register, handleSubmit, formState } = useForm({ defaultValues: DEFAULT_VALUES });
  const { errors } = formState;

  const { savePair, storagePair, voucherBalance, createSession } = useSignlessTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [pair, setPair] = useState<KeyringPair | KeyringPair$Json | undefined>(storagePair);

  useEffect(() => {
    if (pair) return;

    GearKeyring.create('signlessPair').then((result) => setPair(result.keyring));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const openEnableModal = () => setIsEnableModalOpen(true);

  const [isLoading, setIsLoading] = useState(false);

  const issueVoucherValue = useMemo(() => {
    if (!api) throw new Error('API is not initialized');

    const minValue = api.existentialDeposit.toNumber();

    const valueToStart = getChainBalanceValue(BALANCE_VALUE_TO_START_GAME).toNumber();
    const valueToIssueVoucher = getChainBalanceValue(BALANCE_VALUE_TO_ISSUE_VOUCHER).toNumber();

    const totalValueToStart = minValue + valueToStart;
    const totalValueToIssueVoucher = minValue + valueToIssueVoucher;

    return voucherBalance < totalValueToIssueVoucher ? totalValueToStart - voucherBalance : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, voucherBalance]);

  const formattedIssueVoucherValue = getFormattedBalance(issueVoucherValue);

  const onSubmit = (values: typeof DEFAULT_VALUES) => {
    if (!pair) return;

    setIsLoading(true);

    const { password } = values;
    const duration = getMilliseconds(DURATION_MINUTES);
    const key = decodeAddress(pair.address);
    const allowedActions = ACTIONS;

    const onSuccess = () => {
      if (storagePair) {
        openEnableModal();
      } else {
        savePair(pair as KeyringPair, password);
        close();
      }
    };

    const onFinally = () => setIsLoading(false);

    createSession({ duration, key, allowedActions }, issueVoucherValue, { onSuccess, onFinally });
  };

  return (
    <>
      <Modal heading="Enable Signless Session" close={close}>
        <SignlessParams
          params={[
            {
              heading: storagePair ? 'Account from the storage:' : 'Randomly generated account:',
              value: pair ? <AccountPair pair={pair} /> : <span />,
            },
            {
              heading: 'Voucher to issue:',
              value: `${formattedIssueVoucherValue.value} ${formattedIssueVoucherValue.unit}`,
            },
            {
              heading: 'Session duration:',
              value: `${DURATION_MINUTES} min`,
            },
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {!storagePair && (
            <Input
              type="password"
              label="Set password"
              error={errors.password?.message}
              {...register('password', {
                required: REQUIRED_MESSAGE,
                minLength: { value: 6, message: 'Minimum length is 6' },
              })}
            />
          )}

          <Button type="submit" text="Create Signless session" className={styles.button} isLoading={isLoading} />
        </form>
      </Modal>

      {isEnableModalOpen && <EnableSessionModal close={close} />}
    </>
  );
}

export { CreateSessionModal };