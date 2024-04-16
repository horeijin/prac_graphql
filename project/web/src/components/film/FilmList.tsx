// codegen 사용하지 않을 경우엔 이렇게 타입 정의해서 사용
// import { gql, useQuery } from '@apollo/client';

// interface Film {
//   id: number;
//   title: string;
//   subtitle: string;
// }

// type FilmQueryResult = { films: Film[] };

// const FILMS_QUERY = gql`
//   query ExampleQuery {
//     films {
//       id
//       title
//       subtitle
//     }
//   }
// `;

// export default function FilmList(): JSX.Element {
//   const { data, loading, error } = useQuery<FilmQueryResult>(FILMS_QUERY);

//   if (loading) return <p>loading...</p>;
//   if (error) return <p>{error.message}</p>;

//   return <pre>{JSON.stringify(data, null, 2)}</pre>;
// }

// codegen 사용해 만든 타입과 쿼리 활용
import { Box, SimpleGrid, Skeleton } from "@chakra-ui/react";
import { Waypoint } from "react-waypoint";
import { useFilmsQuery } from "../../generated/graphql";
import FilmCard from "./FilmCard";

export default function FilmList(): JSX.Element {
  const LIMIT = 6;
  const { data, loading, error, fetchMore } = useFilmsQuery({
    variables:{
      limit: LIMIT,
      cursor: 1,
    }
  });

  if (error) return <p>{error.message}</p>;

  return (
    <SimpleGrid columns={[2, null, 3]} spacing={[2, null, 10]}>
      {loading &&
        new Array(6).map((x, i) => <Skeleton key={i} height="400px" />)}
      {!loading && data &&
        data.films.films.map((film, i) => (
          <Box key={film.id + film.release}>
            {data.films.cursor && i === data.films.films.length - LIMIT / 2 && (
              <Waypoint
                onEnter={() => {
                  fetchMore({
                    variables: {
                      limit: LIMIT,
                      cursor: data.films.cursor,
                    },
                  });
                }}
              />
            )}
            <FilmCard film={film} />
          </Box>
        ))}
    </SimpleGrid>
  );
}