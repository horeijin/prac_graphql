import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { FC } from 'react';
import SignupForm from '../components/auth/SignUpForm';
import CommonLayout from '../components/CommonLayout';

interface SignUpProps {}

const SignUp:FC<SignUpProps> = ({}) => {
  return (
    <Box bg={useColorModeValue('gray.50', 'gray.800')}>
      <CommonLayout>
        <Flex align="center" justify="center">
          <SignupForm />
        </Flex>
      </CommonLayout>
    </Box>
  );
}

export default SignUp;