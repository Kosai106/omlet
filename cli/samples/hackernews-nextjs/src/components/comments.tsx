import * as React from 'react';

import { NewsItemModel } from '../data/models';
import { Comment, commentFragment } from './comment';

export interface ICommentsProps {
  newsItem: NewsItemModel;
}

export const commentsFragment = `
  fragment Comments on Comment {
    id
    comments {
      id
      comments {
        id
        comments {
          id
          comments {
            id
            ...Comment
          }
          ...Comment
        }
        ...Comment
      }
      ...Comment
    }
    ...Comment
  }
  ${commentFragment}
`;

export function Comments(props: ICommentsProps): JSX.Element {
  const renderComment = (comment, indent: number): JSX.Element => {
    return (
      <Comment key={comment.id} parentId={comment.parent} indentationLevel={indent} {...comment} />
    );
  };
  const { newsItem } = props;

  const rows: JSX.Element[] = [];

  newsItem.comments.forEach((rootComment) => {
    rows.push(renderComment(rootComment, 0));

    rootComment.comments.forEach((commentOne) => {
      rows.push(renderComment(commentOne, 1));

      commentOne.comments.forEach((commentTwo) => {
        rows.push(renderComment(commentTwo, 2));

        commentTwo.comments.forEach((commentThree) => {
          rows.push(renderComment(commentThree, 3));

          commentThree.comments.forEach((commentFour) => {
            rows.push(renderComment(commentFour, 4));

            commentFour.comments.forEach((commentFive) => {
              rows.push(renderComment(commentFive, 5));
            });
          });
        });
      });
    });
  });

  return (
    <table className="comment-tree" style={{ border: '0' }}>
      <tbody>{rows}</tbody>
    </table>
  );
}
